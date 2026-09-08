import "dotenv/config";
import { db } from "../firebase/firebase";
import { loadAudienceCandidates } from "../utils/audienceCandidates";
import { sampleAudienceCandidates } from "../utils/audienceAssignment";
import { AUDIENCE_PILOT_COLLECTION, AUDIENCE_PILOT_ID, createAudiencePilot, loadAudiencePilot } from "../utils/audiencePilot";
import { INTERPRETATION_COLLECTION, interpretationIdentity, isReadyInterpretation } from "../utils/audienceInterpretations";

export async function activateAudiencePilot(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== "--write")) throw new Error("Usage: npm run audience:pilot:prepare -- [--write]");
  const poems = await loadAudienceCandidates();
  if (!sampleAudienceCandidates(poems)) throw new Error("The pilot requires at least two poems from each creator condition");
  for (const poem of poems) {
    const cached = (await db.collection(INTERPRETATION_COLLECTION).doc(interpretationIdentity(poem).id).get()).data();
    if (!isReadyInterpretation(cached, poem)) throw new Error("Prepare all matching interpretations before creating this pilot");
  }
  const pilot = createAudiencePilot(poems);
  const ref = db.collection(AUDIENCE_PILOT_COLLECTION).doc(AUDIENCE_PILOT_ID);
  const existing = await ref.get();
  if (existing.exists) {
    const active = await loadAudiencePilot();
    if (!active || active.poolHash !== pilot.poolHash) {
      throw new Error("This pilot already has a different pool. Use a new AUDIENCE_PILOT_ID for a new collection wave");
    }
  } else if (args.includes("--write")) {
    await ref.create(pilot);
  }
  console.log(JSON.stringify({ pilotId: pilot.id, poolHash: pilot.poolHash, poems: poems.length,
    creatorConditions: { LLM: poems.filter(p => p.condition === "LLM").length, NO_AI: poems.filter(p => p.condition === "NO_AI").length },
    status: existing.exists ? "already-ready" : args.includes("--write") ? "ready" : "ready-to-create" }));
}

if (require.main === module) {
  activateAudiencePilot().catch(error => { console.error(error.message); process.exitCode = 1; });
}
