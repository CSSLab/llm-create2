import type { AudienceAssignment, AudiencePoem, StatementTrial } from "../types";
import { CREATOR_PASSAGE_POOL_VERSION, Passages } from "./passages";

// Demo dataset for showing the audience flow without a live pool of real
// artist submissions to draw from. Everything below is drawn from a single
// fixed passage ("The God of Small Things", id "1") so the four poems, their
// statements, and the source-text reveal all stay consistent with one
// another — a reasonable stand-in for what four real artists' submissions
// for that same passage would look like, hand-picked so each selection
// actually reads as a small poem rather than an arbitrary word sample.
const DEMO_TASK_PASSAGE_ID = "1";
const DEMO_TUTORIAL_PASSAGE_ID = "2";

const demoTaskPassage = Passages.find(
  (passage) => passage.id === DEMO_TASK_PASSAGE_ID,
)!;
const demoTutorialPassage = Passages.find(
  (passage) => passage.id === DEMO_TUTORIAL_PASSAGE_ID,
)!;

interface DemoPoemSeed {
  id: string;
  selectedWordIndexes: number[];
  statement: string;
}

// Word indexes are into `demoTaskPassage.text.split(" ")`. Each selection
// was hand-picked to read as a short, coherent poem on its own:
//   demo-poem-1: "nights clear, southwest monsoon breaks wind water
//                 glittering sunshine bloom."
//   demo-poem-2: "raining Rahel Ayemenem. Slanting silver ropes old house
//                 hill moss, ground."
//   demo-poem-3: "countryside turns immodest moss green. Wild creepers
//                 burst across flooded roads."
//   demo-poem-4: "house wore gabled roof ears hat. soft, little dampness
//                 seeped"
const DEMO_POEM_SEEDS: DemoPoemSeed[] = [
  {
    id: "demo-poem-1",
    selectedWordIndexes: [1, 3, 16, 17, 18, 25, 27, 33, 34, 56],
    statement:
      "I wanted to express that suspended feeling right before a long-awaited change finally arrives, when the tension of waiting starts giving way to relief and renewal.",
  },
  {
    id: "demo-poem-2",
    selectedWordIndexes: [101, 103, 107, 108, 109, 110, 121, 122, 125, 143, 158],
    statement:
      "This is about returning to a childhood home that has grown weathered and changed, and finding that it still somehow remembers you even after everything else has moved on.",
  },
  {
    id: "demo-poem-3",
    selectedWordIndexes: [43, 44, 46, 60, 61, 68, 69, 70, 76, 77, 78],
    statement:
      "I wanted to express how nature can take over a place almost aggressively, growing wild and unchecked in a way that feels both beautiful and a little overwhelming.",
  },
  {
    id: "demo-poem-4",
    selectedWordIndexes: [122, 126, 129, 130, 134, 138, 146, 150, 152, 154],
    statement:
      "I imagined an old house as a tired, aging figure worn down slowly by time and weather, so the poem is really about how age and the passage of time soften and wear everything down.",
  },
];

// Stand-ins for the other (non-featured) artist submissions on this same
// passage that the real pipeline would draw decoy statements from — never
// from the other featured poems themselves. `decoyMatchScore` below picks
// whichever three of these read most similarly to each focal poem's real
// statement, same as the server does.
const DEMO_DECOY_CANDIDATE_STATEMENTS: { id: string; statement: string }[] = [
  {
    id: "demo-decoy-1",
    statement:
      "I wanted to show how memory can feel more vivid than the present moment, like the past is always sitting just underneath everything that's happening now.",
  },
  {
    id: "demo-decoy-2",
    statement:
      "This is about finding calm in something ordinary, the way a familiar routine can feel steadying even when everything else feels uncertain.",
  },
  {
    id: "demo-decoy-3",
    statement:
      "I wanted to capture the restlessness of wanting to leave a place, even one that has always felt safe and familiar.",
  },
  {
    id: "demo-decoy-4",
    statement:
      "This poem is about the way small, ordinary details can carry an enormous amount of feeling once you really pay attention to them.",
  },
  {
    id: "demo-decoy-5",
    statement:
      "I wanted to express a sense of order slowly returning after a long period of chaos, like things finally settling back into place.",
  },
  {
    id: "demo-decoy-6",
    statement:
      "This is about the quiet loneliness of an empty landscape, and how stillness can end up feeling heavier than noise.",
  },
  {
    id: "demo-decoy-7",
    statement:
      "I wanted to capture a burst of sudden energy, like something powerful breaking free all at once.",
  },
  {
    id: "demo-decoy-8",
    statement:
      "This poem is about the excitement of discovering somewhere completely new, full of colors and sounds you've never experienced before.",
  },
];

const shuffle = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- Ported verbatim from the real audience-assignment pipeline
// (server/api/routes/firebaseAPI.ts) so the demo picks decoys the exact
// same way the live system would, instead of at random. ---
const WORD_PATTERN = /[\p{L}\p{N}']+/gu;
const FIRST_PERSON_PATTERN = /\b(i|me|my|mine|we|us|our|ours)\b/i;
const POSITIVE_WORDS = new Set([
  "hope",
  "joy",
  "love",
  "happy",
  "peace",
  "beauty",
  "relief",
  "wonder",
]);
const NEGATIVE_WORDS = new Set([
  "fear",
  "sad",
  "grief",
  "anger",
  "loss",
  "pain",
  "anxiety",
  "despair",
]);
const GENERIC_STATEMENT_WORDS = new Set([
  "about",
  "captures",
  "creator",
  "expresses",
  "explores",
  "feeling",
  "feelings",
  "poem",
  "reflects",
  "sense",
  "something",
  "theme",
]);

const tokenize = (text: string) =>
  (text.toLowerCase().match(WORD_PATTERN) ?? []).filter(
    (token) => token.length > 2,
  );

const statementFeatures = (statement: string, poemText: string) => {
  const statementTokens = tokenize(statement);
  const poemTokens = new Set(tokenize(poemText));
  const overlap = statementTokens.filter((token) => poemTokens.has(token)).length;
  const positive = statementTokens.filter((token) => POSITIVE_WORDS.has(token)).length;
  const negative = statementTokens.filter((token) => NEGATIVE_WORDS.has(token)).length;
  const specificTokenShare = statementTokens.length
    ? statementTokens.filter((token) => !GENERIC_STATEMENT_WORDS.has(token))
        .length / statementTokens.length
    : 0;
  return {
    wordCount: statementTokens.length,
    overlap,
    personal: FIRST_PERSON_PATTERN.test(statement),
    valence: Math.sign(positive - negative),
    specificTokenShare,
  };
};

// Scores how similar a decoy statement is to the true one (lower = more
// similar), so decoys can't be spotted just by length/tone/style.
const decoyMatchScore = (
  trueStatement: string,
  decoyStatement: string,
  poemText: string,
) => {
  const target = statementFeatures(trueStatement, poemText);
  const decoy = statementFeatures(decoyStatement, poemText);
  return (
    Math.abs(target.wordCount - decoy.wordCount) +
    Math.abs(target.overlap - decoy.overlap) * 3 +
    (target.personal === decoy.personal ? 0 : 5) +
    (target.valence === decoy.valence ? 0 : 4) +
    Math.abs(target.specificTokenShare - decoy.specificTokenShare) * 5
  );
};
// --- end ported logic ---

export const createAudienceTestAssignment = (): AudienceAssignment => {
  const poems: AudiencePoem[] = DEMO_POEM_SEEDS.map((seed) => ({
    id: seed.id,
    passageId: demoTaskPassage.id,
    passage: demoTaskPassage,
    selectedWordIndexes: seed.selectedWordIndexes,
  }));

  const words = demoTaskPassage.text.split(" ");

  const statementTrials: StatementTrial[] = DEMO_POEM_SEEDS.map((seed) => {
    const poemText = seed.selectedWordIndexes
      .map((index) => words[index])
      .filter(Boolean)
      .join(" ");

    const decoys = [...DEMO_DECOY_CANDIDATE_STATEMENTS]
      .sort(
        (left, right) =>
          decoyMatchScore(seed.statement, left.statement, poemText) -
          decoyMatchScore(seed.statement, right.statement, poemText),
      )
      .slice(0, 3);

    return {
      poemId: seed.id,
      options: shuffle([
        { id: seed.id, statement: seed.statement },
        ...decoys,
      ]),
    };
  });

  return {
    id: "audience-demo-assignment",
    passageId: demoTaskPassage.id,
    tutorialPassageId: demoTutorialPassage.id,
    taskPassageId: demoTaskPassage.id,
    passagePoolVersion: CREATOR_PASSAGE_POOL_VERSION,
    poems,
    statementTrials,
  };
};
