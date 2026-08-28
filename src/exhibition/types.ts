import type {
  ArtistCondition,
  Message,
  Passage,
  PoemSnapshot,
  Stage,
  TaskTiming,
} from "../types";

export type ExhibitionOutcomes = Record<string, unknown>;

export interface ExhibitionPoem {
  passageId: string;
  passage: Passage;
  text: number[];
  finalPoem: string;
  editHistory: PoemSnapshot[];
  sparkConversation: Message[];
  writeConversation: Message[];
  taskTiming: TaskTiming;
  llmUsage: {
    chatOpenings?: Array<{
      stage: Stage;
      timestamp: Date | string;
    }>;
    chatAvailability?: Array<{
      stage: Stage;
      availableAt: Date | string;
    }>;
    requests: Array<{
      stage: Stage;
      status: "STARTED" | "COMPLETED" | "FAILED";
      requestedAt?: Date | string;
      completedAt?: Date | string;
      failedAt?: Date | string;
    }>;
  };
  derivedMetrics: Record<string, number | boolean | null>;
}

export interface ExhibitionParticipant {
  id: string;
  condition: ArtistCondition;
  assignment?: {
    passageId?: string;
    strategy?: string;
  } | null;
  completedAt?: string | null;
  poem: ExhibitionPoem;
  outcomes: ExhibitionOutcomes;
}

export interface ExhibitionDataset {
  studyId: string;
  generatedAt: string;
  participants: ExhibitionParticipant[];
  isPreview?: boolean;
}

export type TimelineEventKind =
  | "phase"
  | "add"
  | "remove"
  | "undo"
  | "redo"
  | "chat-open"
  | "user-message"
  | "assistant-message";

export interface TimelineEvent {
  id: string;
  atMs: number;
  timestamp: string;
  kind: TimelineEventKind;
  stage: "SPARK" | "WRITE";
  label: string;
  wordIndex?: number;
  message?: Message;
}
