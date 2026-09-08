// Pure assignment rules shared with the client; no database or creator labels
// are included in the participant-facing assignment.
import { INTERPRETATION_DISPLAY, isInterpretationText } from "./audienceInterpretationProtocol";
export const AUDIENCE_PREVIOUS_PROTOCOL_VERSION = "audience-source-with-reading-v2";
export const AUDIENCE_SOURCE_INTERPRETATION_PROTOCOL_VERSION = "audience-interpretation-v3";
export const AUDIENCE_PROTOCOL_VERSION = "audience-poem-only-interpretation-v4";
export const AUDIENCE_PRESENTATION = "blackout-only-no-source-v1";
export const hasAudienceInterpretations = (version: unknown): boolean =>
  version === AUDIENCE_PROTOCOL_VERSION || version === AUDIENCE_SOURCE_INTERPRETATION_PROTOCOL_VERSION;
export const AUDIENCE_SAMPLING_STRATEGY = "balanced-poems-across-passages-v1";
export const AUDIENCE_PASSAGE_POOL_VERSION = "creator-passages-2026-08-05-v1";
export const AUDIENCE_PASSAGE_ID_LIST = [
  "1", "2", "3", "4", "5", "nyt-1", "nyt-2", "nyt-3", "nyt-4",
] as const;
const passageIds = new Set<string>(AUDIENCE_PASSAGE_ID_LIST);

export const shuffle = <T>(items: readonly T[], random = Math.random): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[otherIndex]] = [copy[otherIndex], copy[index]];
  }
  return copy;
};

export const sampleAudienceCandidates = <T extends {
  id: string;
  condition: "LLM" | "NO_AI";
}>(candidates: readonly T[], random = Math.random): T[] | null => {
  const unique = [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()];
  const ai = unique.filter((candidate) => candidate.condition === "LLM");
  const nonAi = unique.filter((candidate) => candidate.condition === "NO_AI");
  if (ai.length < 2 || nonAi.length < 2) return null;
  return shuffle([
    ...shuffle(ai, random).slice(0, 2),
    ...shuffle(nonAi, random).slice(0, 2),
  ], random);
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : undefined;

// Accept the previous protocol too, so sessions started before a deployment
// can still finish. New sessions must carry ordered, per-round passage IDs.
export const isValidAudienceAssignment = (value: unknown): boolean => {
  const assignment = asRecord(value);
  if (!assignment || typeof assignment.id !== "string" || !assignment.id ||
      assignment.passagePoolVersion !== AUDIENCE_PASSAGE_POOL_VERSION ||
      typeof assignment.tutorialPassageId !== "string" ||
      !passageIds.has(assignment.tutorialPassageId) ||
      !Array.isArray(assignment.poems) || assignment.poems.length !== 4 ||
      !Array.isArray(assignment.statementTrials) || assignment.statementTrials.length !== 4) return false;

  const poems = assignment.poems.map(asRecord);
  const poemIds = new Set(poems.map((poem) => poem?.id));
  if (poemIds.size !== 4 || !poems.every((poem) => {
    const passage = asRecord(poem?.passage);
    return poem && typeof poem.id === "string" && poem.id &&
      typeof poem.passageId === "string" && passageIds.has(poem.passageId) &&
      passage?.id === poem.passageId && typeof passage.text === "string" && passage.text.trim() &&
      typeof passage.title === "string" && typeof passage.author === "string" &&
      poem.passageId !== assignment.tutorialPassageId &&
      Array.isArray(poem.selectedWordIndexes) && poem.selectedWordIndexes.length > 0 &&
      new Set(poem.selectedWordIndexes).size === poem.selectedWordIndexes.length &&
      poem.selectedWordIndexes.every((index) => Number.isInteger(index) && index >= 0 &&
        index < (passage.text as string).split(" ").length);
  })) return false;

  if (!assignment.statementTrials.every((value, index) => {
    const trial = asRecord(value);
    if (!trial || trial.poemId !== poems[index]?.id || !Array.isArray(trial.options) ||
        trial.options.length !== 4) return false;
    const options = trial.options.map(asRecord);
    return new Set(options.map((option) => option?.id)).size === 4 &&
      options.some((option) => option?.id === trial.poemId) &&
      options.every((option) => option && typeof option.id === "string" && option.id &&
        typeof option.statement === "string" && option.statement.trim());
  })) return false;

  if (assignment.protocolVersion === undefined) {
    return assignment.passageId === assignment.taskPassageId &&
      poems.every((poem) => poem?.passageId === assignment.taskPassageId);
  }
  if (assignment.protocolVersion === AUDIENCE_PROTOCOL_VERSION &&
      assignment.presentationVersion !== AUDIENCE_PRESENTATION) return false;
  if (hasAudienceInterpretations(assignment.protocolVersion)) {
    if (!["AI", "NO_AI"].includes(assignment.interpretationCondition as string) ||
        assignment.interpretationDisplayVersion !== INTERPRETATION_DISPLAY.version ||
        !poems.every((poem) => typeof poem?.interpretationId === "string" && poem.interpretationId &&
          (assignment.interpretationCondition === "AI"
            ? isInterpretationText(poem.interpretationText)
            : poem.interpretationText === undefined))) return false;
  }
  return [AUDIENCE_PROTOCOL_VERSION, AUDIENCE_SOURCE_INTERPRETATION_PROTOCOL_VERSION,
    AUDIENCE_PREVIOUS_PROTOCOL_VERSION].includes(assignment.protocolVersion as string) &&
    assignment.samplingStrategy === AUDIENCE_SAMPLING_STRATEGY &&
    Array.isArray(assignment.roundPassageIds) && assignment.roundPassageIds.length === 4 &&
    assignment.roundPassageIds.every((id, index) => id === poems[index]?.passageId);
};

export const hasCompleteInterpretationExposure = (value: unknown, assignmentValue: unknown): boolean => {
  const survey = asRecord(value);
  const assignment = asRecord(assignmentValue);
  const records = survey?.interpretationExposures;
  if (!assignment || !Array.isArray(records) || records.length !== 4) return false;
  return (assignment.poems as Array<Record<string, unknown>>).every((poem) => {
    const matches = records.map(asRecord).filter((record) => record?.poemId === poem.id);
    if (matches.length !== 1) return false;
    const entry = matches[0]!;
    const ai = assignment.interpretationCondition === "AI";
    const total = ai ? Array.from(poem.interpretationText as string).length : 0;
    const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
    return entry.condition === assignment.interpretationCondition &&
      entry.interpretationId === (ai ? poem.interpretationId : null) &&
      entry.displayVersion === INTERPRETATION_DISPLAY.version &&
      entry.scheduledDelayMs === INTERPRETATION_DISPLAY.delayMs &&
      entry.characterIntervalMs === INTERPRETATION_DISPLAY.characterIntervalMs &&
      entry.totalCharacters === total &&
      date(entry.screenOpenedAt) && date(entry.recordedAt) && date(entry.submittedAt) &&
      (entry.revealStartedAt === null || date(entry.revealStartedAt)) &&
      (entry.revealCompletedAt === null || date(entry.revealCompletedAt)) &&
      ["elapsedMs", "panelVisibleMs", "documentHiddenMs", "charactersDisplayed", "maxCharactersVisible"].every((field) =>
        typeof entry[field] === "number" && Number.isFinite(entry[field]) && (entry[field] as number) >= 0) &&
      Number.isInteger(entry.charactersDisplayed) && (entry.charactersDisplayed as number) <= total &&
      Number.isInteger(entry.maxCharactersVisible) && (entry.maxCharactersVisible as number) <= (entry.charactersDisplayed as number) &&
      ((entry.charactersDisplayed === 0) === (entry.revealStartedAt === null)) &&
      ((total > 0 && entry.charactersDisplayed === total) === (entry.revealCompletedAt !== null)) &&
      (ai || (entry.panelVisibleMs === 0 && entry.maxCharactersVisible === 0));
  });
};

export const hasCompleteCreativityRatings = (value: unknown, poemIds: string[]): boolean => {
  const survey = asRecord(value);
  if (!survey || !Array.isArray(survey.poemAnswers) || !Array.isArray(survey.creativityRatings) ||
      survey.poemAnswers.length !== poemIds.length || survey.creativityRatings.length !== poemIds.length) return false;
  const answers = survey.poemAnswers.map(asRecord);
  const ratings = survey.creativityRatings.map(asRecord);
  return poemIds.every((id) => {
    const answer = answers.filter((entry) => entry?.poemId === id);
    const rating = ratings.filter((entry) => entry?.poemId === id);
    return answer.length === 1 && rating.length === 1 &&
      typeof rating[0]?.rating === "number" && Number.isInteger(rating[0].rating) &&
      rating[0].rating >= 1 && rating[0].rating <= 7 &&
      answer[0]?.creativity === rating[0].rating;
  });
};
