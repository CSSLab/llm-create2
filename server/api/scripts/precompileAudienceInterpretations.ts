import "dotenv/config";
import { randomUUID } from "node:crypto";
import { db } from "../firebase/firebase";
import { loadAudienceCandidates } from "../utils/audienceCandidates";
import {
  INTERPRETATION_COLLECTION, INTERPRETATION_MODEL, interpretationIdentity,
  interpretationRequest, isReadyInterpretation, sha256,
} from "../utils/audienceInterpretations";
import { isInterpretationText } from "../utils/audienceInterpretationProtocol";

const API = "https://openrouter.ai/api/v1";
interface OpenRouterCompletion extends Record<string, unknown> {
  choices?: Array<{ finish_reason?: string; message?: { content?: unknown; refusal?: unknown } }>;
}

export async function prepareAudienceInterpretations(args = process.argv.slice(2)) {
  if (args.some((arg) => arg !== "--write")) throw new Error("Usage: npm run interpretations:prepare -- [--write]");
  const write = args.includes("--write");
  const candidates = await loadAudienceCandidates();
  const pending = [];
  for (const poem of candidates) {
    const identity = interpretationIdentity(poem);
    const existing = await db.collection(INTERPRETATION_COLLECTION).doc(identity.id).get();
    if (!isReadyInterpretation(existing.data(), poem)) pending.push(poem);
  }
  console.log(JSON.stringify({ mode: write ? "generate" : "plan", eligiblePoems: candidates.length,
    cached: candidates.length - pending.length, pending: pending.length, model: INTERPRETATION_MODEL }));
  if (!write || pending.length === 0) return;
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Set OPENROUTER_API_KEY in server/.env before using --write");
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json",
    "X-OpenRouter-Metadata": "enabled" };
  const catalogAccessedAt = new Date().toISOString();
  const catalogResponse = await fetch(`${API}/models`, { signal: AbortSignal.timeout(60000) });
  if (!catalogResponse.ok) throw new Error(`Model catalog failed: HTTP ${catalogResponse.status}`);
  const catalog = await catalogResponse.json() as { data: Array<Record<string, unknown>> };
  const model = catalog.data.find((entry) => entry.id === INTERPRETATION_MODEL);
  if (!model) throw new Error(`Required model ${INTERPRETATION_MODEL} is unavailable; no substitute will be used`);
  const runId = randomUUID();
  let failures = 0;
  for (const poem of pending) {
    const identity = interpretationIdentity(poem);
    const request = interpretationRequest(poem);
    const requestedAt = new Date().toISOString();
    const attemptRef = db.collection("audienceInterpretationAttempt").doc();
    // Save the exact input/config before sending, including interrupted runs.
    const audit = {
      runId, interpretationId: identity.id, input: identity.input,
      poemTextOrigin: poem.poemTextOrigin, request, requestedAt,
      endpoint: `${API}/chat/completions`, catalogAccessedAt, modelCatalog: model,
      parameterPolicy: "OpenRouter/model defaults; only model and messages explicitly supplied",
      clientRuntime: process.version,
    };
    await attemptRef.create({ ...audit, status: "requested" });
    try {
      const response = await fetch(`${API}/chat/completions`, {
        method: "POST", headers, body: JSON.stringify(request), signal: AbortSignal.timeout(300000),
      });
      const receivedAt = new Date().toISOString();
      const completion = await response.json() as OpenRouterCompletion;
      // Store the complete completion response, including usage, provider,
      // returned model, fingerprint and router metadata when disclosed.
      await attemptRef.update({ receivedAt, httpStatus: response.status, response: completion, status: "received" });
      const choice = completion.choices?.[0];
      const rawText = choice?.message?.content;
      const text = typeof rawText === "string" ? rawText.trim() : rawText;
      if (!response.ok || completion.error || choice?.finish_reason !== "stop" ||
          !isInterpretationText(text) || choice?.message?.refusal) {
        throw new Error(`Unusable completion (HTTP ${response.status}; requires one paragraph of 1–100 words and finish_reason=stop)`);
      }
      // Never overwrite a cached stimulus. Re-running resumes missing poems.
      await db.collection(INTERPRETATION_COLLECTION).doc(identity.id).create({
        id: identity.id, status: "ready", text, textHash: sha256(text),
        poemId: poem.id, passageId: poem.passageId, attemptId: attemptRef.id,
        ...audit, receivedAt,
        returnedModel: completion.model ?? null, provider: completion.provider ?? null,
        systemFingerprint: completion.system_fingerprint ?? null,
        generationId: completion.id ?? null,
        // A dated underlying snapshot may not be disclosed; do not invent one.
        snapshotDisclosure: "See returnedModel, modelCatalog.canonical_slug and response metadata; undisclosed underlying versions remain unknown",
      });
      await attemptRef.update({ status: "ready" });
      console.log(JSON.stringify({ poemId: poem.id, interpretationId: identity.id, status: "ready" }));
    } catch (error) {
      failures += 1;
      // Error bodies and credentials are never printed to the terminal.
      const message = error instanceof Error ? error.message : "Generation failed";
      await attemptRef.update({ status: "failed", failedAt: new Date().toISOString(), failure: message });
      console.error(JSON.stringify({ poemId: poem.id, status: "failed", message }));
    }
  }
  if (failures) throw new Error(`${failures} interpretations failed; review audienceInterpretationAttempt before retrying`);
}

if (require.main === module) {
  prepareAudienceInterpretations().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
