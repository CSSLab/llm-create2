import type { AudienceAssignment, AudiencePoem } from "../types";
import {
  CREATOR_PASSAGE_POOL_VERSION,
  sampleDistinctPassages,
} from "./passages";

const TEST_SELECTIONS = [
  [0, 1, 4, 8, 12, 18, 24],
  [2, 5, 6, 11, 15, 20, 28],
  [3, 7, 9, 13, 17, 23, 31],
  [1, 10, 14, 19, 22, 27, 34],
];

const TEST_STATEMENTS = [
  "The poem reflects the tension between anticipation and the unknown.",
  "The poem is about finding moments of beauty inside an unsettled world.",
  "The poem explores how a place can hold memories that feel alive.",
  "The poem expresses a quiet desire to move beyond fear and begin again.",
  "The poem considers how change can arrive before we are ready for it.",
  "The poem is about noticing small signs of hope in an ordinary landscape.",
  "The poem captures the feeling of being pulled between stillness and motion.",
];

const rotate = <T,>(items: T[], offset: number) => [
  ...items.slice(offset),
  ...items.slice(0, offset),
];

// Dummy 4-poem assignment used when previewing the audience flow without
// real artist submissions to draw from (explicit test captcha code, or the
// server reporting an insufficient candidate pool).
export const createAudienceTestAssignment = (): AudienceAssignment => {
  const { tutorialPassage, taskPassage } = sampleDistinctPassages();
  const wordCount = taskPassage.text.split(" ").length;
  const poems: AudiencePoem[] = TEST_SELECTIONS.map((selection, index) => ({
    id: `test-poem-${index + 1}`,
    passageId: taskPassage.id,
    passage: taskPassage,
    selectedWordIndexes: selection.filter((wordIndex) => wordIndex < wordCount),
  }));

  return {
    id: "audience-test-assignment",
    passageId: taskPassage.id,
    tutorialPassageId: tutorialPassage.id,
    taskPassageId: taskPassage.id,
    passagePoolVersion: CREATOR_PASSAGE_POOL_VERSION,
    poems,
    statementTrials: poems.map((poem, index) => {
      const decoyIndexes = [4, 5, 6];
      const options = [
        { id: poem.id, statement: TEST_STATEMENTS[index] },
        ...decoyIndexes.map((statementIndex) => ({
          id: `test-decoy-${statementIndex}`,
          statement: TEST_STATEMENTS[statementIndex],
        })),
      ];
      return { poemId: poem.id, options: rotate(options, index % 4) };
    }),
  };
};
