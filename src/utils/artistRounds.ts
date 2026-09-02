import type {
  ArtistCondition,
  Passage,
  Poem,
  SurveyDefinition,
} from "../types";
import { ARTIST_DATA_LOGGING_VERSION } from "../consts/dataLogging";

export const TOTAL_ARTIST_POEMS = 3;

const GENERAL_POST_SURVEY_SECTION_IDS = new Set([
  "outside-tools",
  "exploratory-operational",
]);

export const createEmptyPoem = (passage: Passage): Poem => ({
  loggingSchemaVersion: ARTIST_DATA_LOGGING_VERSION,
  passageId: passage.id,
  passage,
  text: [],
  sparkConversation: [],
  writeConversation: [],
  sparkNotes: "",
  writeNotes: "",
  poemSnapshot: [],
  taskTiming: { phases: {} },
  llmUsage: {
    chatAvailability: [],
    inputActivity: [],
    requests: [],
  },
});

/**
 * Randomizes the active passage pool and exhausts it before repeating. This
 * keeps assignment valid even while a deployment has fewer than three active
 * passages, and automatically becomes without-replacement when the pool grows.
 */
export const createPassageSequence = (
  passages: Passage[],
  count = TOTAL_ARTIST_POEMS,
  random: () => number = Math.random,
): string[] => {
  if (passages.length === 0) {
    throw new Error("At least one passage is required for assignment");
  }

  const shuffledIds = passages.map((passage) => passage.id);
  for (let index = shuffledIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffledIds[index], shuffledIds[swapIndex]] = [
      shuffledIds[swapIndex],
      shuffledIds[index],
    ];
  }

  return Array.from(
    { length: count },
    (_, index) => shuffledIds[index % shuffledIds.length],
  );
};

export const getPassageForPoem = (
  passages: Passage[],
  passageIds: string[],
  poemNumber: number,
): Passage => {
  const passageId = passageIds[poemNumber - 1];
  const passage = passages.find((candidate) => candidate.id === passageId);
  if (!passage) {
    throw new Error(`Passage assignment for poem ${poemNumber} is invalid`);
  }
  return passage;
};

export const getArtistPostSurveyForPoem = (
  survey: SurveyDefinition,
  poemNumber: number,
  totalPoems: number,
  condition: ArtistCondition,
): SurveyDefinition => {
  const isFinalPoem = poemNumber === totalPoems;

  return {
    ...survey,
    sections: survey.sections.filter((section) => {
      const matchesCondition =
        !section.conditions || section.conditions.includes(condition);
      const belongsInThisRound =
        isFinalPoem || !GENERAL_POST_SURVEY_SECTION_IDS.has(section.id);
      return matchesCondition && belongsInThisRound;
    }),
  };
};
