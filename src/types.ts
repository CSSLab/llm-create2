// ARTIST TYPES
export interface Artist {
  condition: ArtistCondition;
  surveyResponse: ArtistSurvey;
  poem: Poem;
  timeStamps: Date[];
  assignment?: ArtistAssignment;
}

export interface ArtistAssignment {
  strategy:
    | "INDEPENDENT_RANDOM_1_TO_1"
    | "PASSAGE_STRATIFIED_1_TO_1"
    | "TEST_OVERRIDE";
  passageId: string;
  condition: ArtistCondition;
  assignedAt: Date;
}

export interface ArtistSurvey {
  id: string;
  preSurvey: SurveyDefinition;
  preAnswers: SurveyAnswers;
  postSurvey: SurveyDefinition;
  postAnswers: SurveyAnswers;
}

// export interface SurveyQuestion {
//   id: string;
//   q: string;
//   answerType:
// }

export interface Poem {
  passageId: string; // passageId in Passage.id
  passage: Passage;
  text: number[]; // this array holds the indexes of each word chosen from the passage
  poemSnapshot: PoemSnapshot[];
  sparkConversation?: Message[]; // LLM conversation in spark phase
  writeConversation?: Message[]; // LLM conversation in writing phase
  sparkNotes: string;
  writeNotes: string;
  taskTiming: TaskTiming;
  llmUsage: LlmUsage;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export interface PhaseTiming {
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

export interface TaskTiming {
  startedAt?: Date;
  completedAt?: Date;
  totalDurationMs?: number;
  phases: {
    spark?: PhaseTiming;
    write?: PhaseTiming;
  };
}

export interface ChatOpening {
  stage: Stage;
  timestamp: Date;
}

export interface LlmRequestLog {
  id: string;
  stage: Stage;
  userMessageId: string;
  userMessageContent: string;
  assistantMessageId?: string;
  requestedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  status: "STARTED" | "COMPLETED" | "FAILED";
  systemPrompt: string;
  promptVersion: string;
  model?: string;
  modelVersion?: string;
  generationParameters?: Record<string, unknown>;
  error?: string;
}

export interface LlmUsage {
  chatOpenings: ChatOpening[];
  requests: LlmRequestLog[];
}

export interface Passage {
  id: string;
  text: string;
  title: string;
  author: string;
}

export const Stage = {
  SPARK: "SPARK",
  WRITE: "WRITE",
};
export type Stage = (typeof Stage)[keyof typeof Stage];

export const ArtistCondition = {
  NO_AI: "NO_AI",
  LLM: "LLM",
} as const;
export type ArtistCondition =
  (typeof ArtistCondition)[keyof typeof ArtistCondition];

export const Role = {
  ARTIST: "user",
  LLM: "assistant",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// AUDIENCE TYPES
export interface Audience {
  condition: AudienceCondition;
  surveyResponse: AudienceSurvey;
  poemFeedback: PoemFeedback;
  timeStamps: Date[];
}

// TODO: Exact survey questions tbd
export interface AudienceSurvey {
  id: string;
  preSurvey: SurveyDefinition;
  preAnswers: SurveyAnswers;
  postSurvey: SurveyDefinition;
  postAnswers: SurveyAnswers;
}

// TODO: Exact poem feedback fields tbd
export interface PoemFeedback {
  id: string;
  poemId: string;
  rating: number;
}

export interface Passage {
  id: string;
  text: string;
}

export const AudienceCondition = {
  NO_KNOWLEDGE: "NO_KNOWLEDGE",
  FULL_TRANSPARENCY: "FULL_TRANSPARENCY",
} as const;
export type AudienceCondition =
  (typeof AudienceCondition)[keyof typeof AudienceCondition];

export type QuestionType =
  | "multipleChoice"
  | "openEnded"
  | "likertScale"
  | "circularChoice"
  | "emotionWheel"
  | "range"
  | "topXRanking";

export interface AnswerCondition {
  questionId: string;
  equals: string | number;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
  required?: boolean;
  answer?: unknown;
  showWhen?: AnswerCondition;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multipleChoice";
  options: string[];
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: "openEnded";
  placeholder?: string;
  softWordTarget?: {
    min: number;
    max: number;
  };
}

export interface LikertScaleQuestion extends BaseQuestion {
  type: "likertScale";
  options: Array<{
    label: string;
    value: number;
  }>;
  sideTitle?: boolean;
  doNotCollapse?: boolean;
  removeValues?: boolean;
}

export interface RangeQuestion extends BaseQuestion {
  type: "range";
  labels: { min: string; max: string };
}

export interface CircularMultipleChoiceQuestion extends BaseQuestion {
  type: "circularChoice";
  options: string[];
}

export interface EmotionWheelQuestion extends BaseQuestion {
  type: "emotionWheel";
  options: string[];
  intensityLevels: 5;
  includeNoEmotion: true;
}

export interface EmotionWheelAnswer {
  emotion: string;
  intensity: 0 | 1 | 2 | 3 | 4 | 5;
}

export type Question =
  | MultipleChoiceQuestion
  | OpenEndedQuestion
  | LikertScaleQuestion
  | CircularMultipleChoiceQuestion
  | EmotionWheelQuestion
  | RangeQuestion
  | TopXRankingQuestion;

export interface Section {
  id: string;
  title: string;
  description?: string;
  conditions?: Condition[];
  questions: Question[];
}

export type Condition = ArtistCondition | AudienceCondition | undefined;

export interface SurveyDefinition {
  id: string;
  title: string;
  sections: Section[];
}

export type AnswerValue =
  | string
  | string[]
  | number
  | EmotionWheelAnswer
  | null;

export interface SurveyAnswers {
  [questionId: string]: AnswerValue;
}

export interface TopXRankingQuestion extends BaseQuestion {
  type: "topXRanking";
  options: string[];
  maxSelectable: number; // maximum number of selectable options
}

export interface ProlificMeta {
  prolificPid: string;
  studyId: string;
  prolificSessionId: string;
}

export type UserData =
  | { role: "artist"; data: Artist; prolific?: ProlificMeta }
  | { role: "audience"; data: Audience; prolific?: ProlificMeta };

export type PoemSnapshot = {
  action: "ADD" | "REMOVE";
  index: number;
  timestamp: Date;
  source: "DIRECT" | "UNDO" | "REDO";
};

export interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For multiple choice
  scale?: number; // For scale questions (e.g., 7-point scale)
}
