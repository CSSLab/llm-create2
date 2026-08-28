import { Passages } from "../../consts/passages";
import type {
  LegacyChatOpening,
  Message,
  PoemSnapshot,
  TaskTiming,
} from "../../types";
import type {
  ExhibitionDataset,
  ExhibitionParticipant,
} from "../types";

const BASE_TIME = new Date("2026-08-24T22:14:00.000Z").getTime();

const selections = [
  [1, 4, 6, 11, 18, 26, 38, 54, 67],
  [2, 8, 14, 21, 29, 41, 56, 73, 91, 108],
  [0, 5, 12, 19, 35, 48, 60, 75, 86],
  [3, 9, 17, 31, 44, 59, 77, 96],
  [1, 13, 25, 39, 52, 68, 84, 105],
  [4, 16, 28, 43, 57, 71, 89, 112],
  [2, 10, 23, 36, 51, 66, 82, 101],
];

const makeTiming = (start: number, totalMs: number): TaskTiming => {
  const sparkStart = new Date(start);
  const writeStart = new Date(start + 95_000);
  const completedAt = new Date(start + totalMs);
  return {
    startedAt: sparkStart,
    completedAt,
    totalDurationMs: totalMs,
    phases: {
      spark: {
        startedAt: sparkStart,
        completedAt: writeStart,
        durationMs: 95_000,
      },
      write: {
        startedAt: writeStart,
        completedAt,
        durationMs: totalMs - 95_000,
      },
    },
  };
};

const makeHistory = (
  indexes: number[],
  writeStart: number,
): PoemSnapshot[] => {
  const events: PoemSnapshot[] = indexes.map((index, eventIndex) => ({
    action: "ADD",
    index,
    timestamp: new Date(writeStart + eventIndex * 17_000),
    source: "DIRECT",
  }));
  const revisedIndex = indexes[2];
  if (revisedIndex !== undefined) {
    events.splice(4, 0, {
      action: "REMOVE",
      index: revisedIndex,
      timestamp: new Date(writeStart + 58_000),
      source: "DIRECT",
    });
    events.splice(6, 0, {
      action: "ADD",
      index: revisedIndex,
      timestamp: new Date(writeStart + 82_000),
      source: "UNDO",
    });
  }
  return events;
};

const makeLlmHistory = (start: number) => {
  const sparkConversation: Message[] = [
    {
      id: "assistant-opening",
      role: "assistant",
      content: "What image or feeling in the passage keeps pulling your attention?",
      timestamp: new Date(start + 18_000),
      stage: "SPARK",
      kind: "STAGE_OPENING",
    },
    {
      id: "participant-spark",
      role: "user",
      content: "I like the tension between the city and the possible future.",
      timestamp: new Date(start + 35_000),
      stage: "SPARK",
      kind: "USER_MESSAGE",
    },
    {
      id: "assistant-spark",
      role: "assistant",
      content: "You could follow the future-facing words, or make the city interrupt that optimism. Which tension feels truer?",
      timestamp: new Date(start + 48_000),
      stage: "SPARK",
      kind: "LLM_RESPONSE",
    },
  ];
  const writeConversation: Message[] = [
    {
      id: "participant-write",
      role: "user",
      content: "Help me find a short ending that still feels hopeful.",
      timestamp: new Date(start + 142_000),
      stage: "WRITE",
      kind: "USER_MESSAGE",
    },
    {
      id: "assistant-write",
      role: "assistant",
      content: "Try ending on **possible future** for openness, or **golden tissue** for a more fragile kind of hope.",
      timestamp: new Date(start + 151_000),
      stage: "WRITE",
      kind: "LLM_RESPONSE",
    },
  ];
  const chatOpenings: LegacyChatOpening[] = [
    { stage: "SPARK", timestamp: new Date(start + 15_000) },
    { stage: "WRITE", timestamp: new Date(start + 135_000) },
  ];
  return { sparkConversation, writeConversation, chatOpenings };
};

const makeParticipant = (index: number): ExhibitionParticipant => {
  const passage = Passages[index % Passages.length];
  const selected = selections[index] ?? [];
  const start = BASE_TIME + index * 1_800_000;
  const totalMs = [718_000, 1_031_000, 794_000, 527_000, 1_094_000, 455_000, 639_000][index] ?? 600_000;
  const timing = makeTiming(start, totalMs);
  const writeStart = new Date(timing.phases.write?.startedAt ?? start).getTime();
  const isLlm = index === 2;
  const llm = isLlm
    ? makeLlmHistory(start)
    : { sparkConversation: [], writeConversation: [], chatOpenings: [] };
  const finalPoem = selected
    .map((wordIndex) => passage.text.split(" ")[wordIndex])
    .filter(Boolean)
    .join(" ");

  return {
    id: `poem-${String(index + 1).padStart(2, "0")}`,
    condition: isLlm ? "LLM" : "NO_AI",
    assignment: { passageId: passage.id, strategy: "PREVIEW" },
    completedAt: new Date(start + totalMs).toISOString(),
    poem: {
      passageId: passage.id,
      passage,
      text: selected,
      finalPoem,
      editHistory: makeHistory(selected, writeStart),
      sparkConversation: llm.sparkConversation,
      writeConversation: llm.writeConversation,
      taskTiming: timing,
      llmUsage: {
        chatOpenings: llm.chatOpenings,
        requests: [],
      },
      derivedMetrics: {
        selectedWordCount: selected.length,
        totalEditingActivity: selected.length + 2,
        totalTaskTimeMs: totalMs,
        llmTurnCount: isLlm ? 2 : 0,
      },
    },
    outcomes: {
      final_intended_meaning:
        index % 2 === 0
          ? "A hopeful reminder that the future is assembled from small acts of attention."
          : "The poem holds a quiet tension between change and the wish to remain known.",
      felt_emotion: { emotion: index % 2 === 0 ? "Joy" : "Sadness", intensity: 4 },
      intended_emotion: { emotion: index % 2 === 0 ? "Hope" : "Longing", intensity: 4 },
      expressive_realization: 6,
      ownership_own_work: isLlm ? 5 : 7,
      ownership_responsibility: 7,
      ownership_personal_connection: 6,
      ownership_emotional_connection: 6,
      creative_control: isLlm ? 4 : 5,
      creative_intentionality: 5,
      mental_effort: 4,
      llm_contribution_attribution: isLlm
        ? "I was creating the poem and AI was assisting me."
        : undefined,
    },
  };
};

export const previewDataset: ExhibitionDataset = {
  studyId: "6a8cbdb524cc2e2b32049b00",
  generatedAt: new Date(BASE_TIME).toISOString(),
  isPreview: true,
  participants: Array.from({ length: 7 }, (_, index) => makeParticipant(index)),
};
