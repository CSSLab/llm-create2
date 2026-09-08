import { createHash } from "node:crypto";
import { isInterpretationText } from "./audienceInterpretationProtocol";

export const INTERPRETATION_COLLECTION = "audienceInterpretation";
export const INTERPRETATION_PROMPT_VERSION = "blackout-interpretation-poem-only-v3";
export const INTERPRETATION_MODEL = "openai/gpt-6-astra";
export const INTERPRETATION_GENERATION_CONFIG = {
  reasoning: { effort: "low" },
  provider: { require_parameters: true },
} as const;
export const INTERPRETATION_SYSTEM_PROMPT = `You are helping a reader interpret a blackout poem: a poem made by keeping selected words from a longer passage and obscuring the rest.

Offer one possible interpretation of what the poem is expressing or about, grounded only in the poem provided. Describe what the poem may suggest without claiming to know the creator’s intentions. Focus on interpretation rather than judging the poem’s quality or suggesting revisions.

Write one short paragraph in clear, everyday language. Return only the interpretation, without a heading or follow-up question.`;

export const interpretationUserPrompt = (poem: string) =>
  `What do you think this blackout poem is expressing or about?

Blackout poem:
<poem>
${poem}
</poem>`;

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function getFinalPoemText(source: string, indexes: number[], creatorText?: unknown): {
  finalPoemText: string;
  poemTextOrigin: "creator-final-text" | "source-word-indexes";
} {
  // Selection order records click order; the rendered poem follows source order.
  const words = source.split(" ");
  const reconstructed = [...new Set(indexes)].sort((a, b) => a - b)
    .map((index) => words[index]).join(" ");
  if (typeof creatorText === "string") {
    // Preserve supplied punctuation/line breaks verbatim; do not silently use
    // a transcription that describes a different poem.
    const normalize = (text: string) => text.trim().replace(/\s+/gu, " ");
    if (normalize(creatorText) !== normalize(reconstructed)) {
      throw new Error("Creator finalPoemText does not match the selected source words");
    }
    return { finalPoemText: creatorText, poemTextOrigin: "creator-final-text" };
  }
  return { finalPoemText: reconstructed, poemTextOrigin: "source-word-indexes" };
}

export interface InterpretationInput {
  id: string;
  passageId: string;
  passage: { text: string };
  finalPoemText: string;
  poemTextOrigin: string;
}

export function interpretationIdentity(poem: InterpretationInput) {
  const input = {
    poemId: poem.id,
    passageId: poem.passageId,
    inputContext: "poem-only",
    finalPoemText: poem.finalPoemText,
    promptVersion: INTERPRETATION_PROMPT_VERSION,
    model: INTERPRETATION_MODEL,
    generationConfig: INTERPRETATION_GENERATION_CONFIG,
    systemPrompt: INTERPRETATION_SYSTEM_PROMPT,
  };
  return { id: sha256(JSON.stringify(input)), input };
}

export function isReadyInterpretation(value: unknown, poem: InterpretationInput):
  value is { id: string; text: string; status: "ready"; textHash: string } {
  const record = value as Record<string, unknown> | undefined;
  return !!record && record.id === interpretationIdentity(poem).id &&
    record.status === "ready" && isInterpretationText(record.text) &&
    record.textHash === sha256(record.text);
}

// Require providers to honor the requested settings. Other sampling parameters
// remain at service/model defaults; the exact config is part of the cache ID.
export const interpretationRequest = (poem: InterpretationInput) => ({
  model: INTERPRETATION_MODEL,
  ...INTERPRETATION_GENERATION_CONFIG,
  messages: [
    { role: "system", content: INTERPRETATION_SYSTEM_PROMPT },
    { role: "user", content: interpretationUserPrompt(poem.finalPoemText) },
  ],
});
