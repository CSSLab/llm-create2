import type { AudienceAssignment, AudiencePoem, InterpretationCondition } from "../types";
import {
  CREATOR_PASSAGE_POOL_VERSION,
  Passages,
} from "./passages";
import { AUDIENCE_PROTOCOL_VERSION, AUDIENCE_PRESENTATION, AUDIENCE_SAMPLING_STRATEGY, shuffle } from "../../server/api/utils/audienceAssignment";
import { PASSAGE_DISTRACTOR_STATEMENTS } from "./audienceDistractors";

import { assignInterpretationCondition, INTERPRETATION_DISPLAY } from "../../server/api/utils/audienceInterpretationProtocol";

const TEST_SELECTIONS = [
  [0, 1, 4, 8, 12, 18, 24],
  [2, 5, 6, 11, 15, 20, 28],
  [3, 7, 9, 13, 17, 23, 31],
  [1, 10, 14, 19, 22, 27, 34],
];

// Generic fallback if a passage ever lands here without a hand-written set
// in PASSAGE_DISTRACTOR_STATEMENTS (shouldn't happen - every passage has one).
const FALLBACK_STATEMENTS = [
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
export const createAudienceTestAssignment = (condition: InterpretationCondition = assignInterpretationCondition()): AudienceAssignment => {
  const poems: AudiencePoem[] = shuffle(TEST_SELECTIONS).map((selection, index) => {
    const passage = Passages[Math.floor(Math.random() * Passages.length)];
    return {
      id: `test-poem-${index + 1}`,
      passageId: passage.id,
      passage,
      interpretationId: `preview-interpretation-${index + 1}`,
      ...(condition === "AI" && {
        interpretationText: `The poem may suggest a moment of change, with a speaker noticing details that feel uncertain or unfamiliar. Its wording leaves room to read it as fragments of a memory or an unfinished thought. This is sample interpretation text for preview poem ${index + 1}.`,
      }),
      selectedWordIndexes: selection.filter((wordIndex) => wordIndex < passage.text.split(" ").length),
    };
  });
  const roundPassageIds = poems.map((poem) => poem.passageId);
  const tutorialPassage = shuffle(Passages.filter((passage) => !roundPassageIds.includes(passage.id)))[0];

  return {
    id: "audience-test-assignment",
    protocolVersion: AUDIENCE_PROTOCOL_VERSION,
    presentationVersion: AUDIENCE_PRESENTATION,
    samplingStrategy: AUDIENCE_SAMPLING_STRATEGY,
    interpretationCondition: condition,
    interpretationDisplayVersion: INTERPRETATION_DISPLAY.version,
    roundPassageIds,
    tutorialPassageId: tutorialPassage.id,
    passagePoolVersion: CREATOR_PASSAGE_POOL_VERSION,
    poems,
    statementTrials: poems.map((poem, index) => {
      const statements = PASSAGE_DISTRACTOR_STATEMENTS[poem.passageId] ?? FALLBACK_STATEMENTS;
      const decoyIndexes = [4, 5, 6];
      const options = [
        { id: poem.id, statement: statements[index] },
        ...decoyIndexes.map((statementIndex) => ({
          id: `test-decoy-${statementIndex}`,
          statement: statements[statementIndex],
        })),
      ];
      return { poemId: poem.id, options: rotate(options, index % 4) };
    }),
  };
};
