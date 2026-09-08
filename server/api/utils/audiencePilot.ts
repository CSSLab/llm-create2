import { db } from "../firebase/firebase";
import type { AudienceCandidate } from "./audienceCandidates";
import { AUDIENCE_PASSAGE_POOL_VERSION } from "./audienceAssignment";
import { interpretationIdentity, INTERPRETATION_PROMPT_VERSION, sha256 } from "./audienceInterpretations";

export const AUDIENCE_PILOT_COLLECTION = "audiencePilot";
export const AUDIENCE_PILOT_ID = process.env.AUDIENCE_PILOT_ID || "audience-existing-poems-2026-09-08-v1";

export interface AudiencePilot {
  id: string;
  poolHash: string;
  passagePoolVersion: string;
  promptVersion: string;
  createdAt: string;
  poems: AudienceCandidate[];
}

// Explicit field ordering keeps the digest stable after Firestore reorders maps.
export const audiencePoolHash = (poems: AudienceCandidate[]) => sha256(JSON.stringify(
  [...poems].sort((a, b) => a.id.localeCompare(b.id)).map(poem => [
    interpretationIdentity(poem).id, poem.condition, poem.passageId,
    poem.passage.text, poem.passage.title, poem.passage.author, poem.passage.publication ?? null,
    poem.selectedWordIndexes, poem.statement,
  ]),
));

export const createAudiencePilot = (poems: AudienceCandidate[]): AudiencePilot => ({
  id: AUDIENCE_PILOT_ID,
  poolHash: audiencePoolHash(poems),
  passagePoolVersion: AUDIENCE_PASSAGE_POOL_VERSION,
  promptVersion: INTERPRETATION_PROMPT_VERSION,
  createdAt: new Date().toISOString(),
  poems,
});

export async function loadAudiencePilot(): Promise<AudiencePilot | null> {
  const data = (await db.collection(AUDIENCE_PILOT_COLLECTION).doc(AUDIENCE_PILOT_ID).get()).data();
  try {
    if (!data || data.id !== AUDIENCE_PILOT_ID || data.passagePoolVersion !== AUDIENCE_PASSAGE_POOL_VERSION ||
        data.promptVersion !== INTERPRETATION_PROMPT_VERSION || !Array.isArray(data.poems) ||
        new Set(data.poems.map(poem => poem.id)).size !== data.poems.length ||
        !data.poems.every(poem => ["LLM", "NO_AI"].includes(poem.condition)) ||
        data.poolHash !== audiencePoolHash(data.poems)) return null;
    return data as AudiencePilot;
  } catch {
    return null;
  }
}
