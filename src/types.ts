import type { ReactNode } from "react";

// ARTIST TYPES
export interface Artist {
  condition: ArtistCondition;
  surveyResponse: ArtistSurvey;
  poem: Poem;
  timeStamps: Date[];
}

export interface ArtistSurvey {
  id: string;
  preSurvey: SurveyDefinition;
  preAnswers: SurveyAnswers;
  postSurvey: SurveyDefinition;
  postAnswers: SurveyAnswers;
}

export interface Poem {
  passageId: string; // passageId in Passage.id
  passage: Passage;
  text: number[]; // this array holds the indexes of each word chosen from the passage
  poemSnapshot: PoemSnapshot[];
  sparkConversation?: Message[]; // LLM conversation in spark phase
  writeConversation?: Message[]; // LLM conversation in writing phase
  sparkNotes: string;
  writeNotes: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
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
  CONTROL: "CONTROL",
  SPARK: "SPARK",
  WRITING: "WRITING",
  TOTAL_ACCESS: "TOTAL_ACCESS",
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
  passageId: string;
  surveyResponse: AudienceSurvey;
  poemsViewed: AudiencePoem[];
  // The 4 poems (and their AI overviews, if applicable) chosen for this
  // audience member at captcha time. Fixed for the rest of the study.
  poems: (Poem & { id: string; artistId: string })[];
  overviews: Record<string, string>;
  timeStamps: Date[];
  // The decoy poems/statements (from other artists' poems) shown alongside
  // the real ones in the "guess which statement matches which poem" question.
  distractorStatements: { poemId: string; statement: string }[];
  prolific?: ProlificMeta;
}

// TODO: Exact survey questions tbd
export interface AudienceSurvey {
  id: string;
  preSurvey: SurveyDefinition;
  preAnswers: SurveyAnswers;
  poemSurvey: PoemSurveyDefinition[];
  poemAnswers: PoemSurveyAnswers[];
  rankingSurvey: SurveyDefinition;
  rankingAnswers: SurveyAnswers;
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
  WITH_AI_OVERVIEW: "WITH_AI_OVERVIEW",
  WITHOUT_AI_OVERVIEW: "WITHOUT_AI_OVERVIEW",
} as const;
export type AudienceCondition =
  (typeof AudienceCondition)[keyof typeof AudienceCondition];

export type QuestionType =
  | "multipleChoice"
  | "openEnded"
  | "likertScale"
  | "circularChoice"
  | "range"
  | "topXRanking"
  | "dragRank"
  | "selectAll";

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
  required?: boolean;
  children?: ReactNode;
  answer?: any;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multipleChoice";
  options: string[];
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: "openEnded";
  placeholder?: string;
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

export type Question =
  | MultipleChoiceQuestion
  | OpenEndedQuestion
  | LikertScaleQuestion
  | CircularMultipleChoiceQuestion
  | RangeQuestion
  | TopXRankingQuestion
  | DragRankQuestion
  | SelectAllQuestion;

export interface Section {
  id: string;
  title: string;
  description?: string;
  conditions?: Condition[];
  questions: Question[];
}

export type Condition = ArtistCondition | undefined;

export interface SurveyDefinition {
  id: string;
  title: string;
  sections: Section[];
}

export interface PoemSurveyDefinition extends SurveyDefinition {}

export interface PoemSurveyAnswers extends SurveyAnswers {
  poemId: string;
}

// Ranking survey data structures
export interface StatementMatch {
  poemId: string;
  isCorrect: boolean;
  chosenStatement: string;
  explanation?: string;
}

export interface PoemRankings {
  favourite: string[]; // most liked to least liked
  impact: string[]; // most emotionally impactful to least
  creative: string[]; // most creative to least
}

export interface RankingData {
  poemRankings: PoemRankings;
  statementMatches: StatementMatch[];
}

export interface ReRankingData {
  poemRankings: PoemRankings;
}

export type AnswerValue = string | string[] | number | null;

export interface SurveyAnswers {
  [questionId: string]: AnswerValue;
}

export interface TopXRankingQuestion extends BaseQuestion {
  type: "topXRanking";
  options: string[];
  maxSelectable: number; // maximum number of selectable options
}

export interface DragRankItem {
  id: string;
  title: string;
  content?: ReactNode;
}

export interface SelectAllItem {
  id: string;
  title: string;
  content?: ReactNode;
}

export interface SelectAllQuestion extends BaseQuestion {
  type: "selectAll";

  items: SelectAllItem[];
  defaultExpanded?: string[];
  minSelections?: number;
  maxSelections?: number;
}

export interface DragRankQuestion extends BaseQuestion {
  type: "dragRank";
  items: DragRankItem[];
  // Optional initial order of item ids. When provided it will be used
  // as the initial order unless a controlled `value` is passed to the component.
  initialOrder?: string[];
  // Optional list of item ids that should be expanded by default.
  defaultExpanded?: string[];
  // Optional flag to enable/disable dragging UI for this question.
  draggable?: boolean;
}

export interface ProlificMeta {
  prolificPid: string;
  studyId: string;
  prolificSessionId: string;
}

export type UserData =
  | { role: "artist"; data: Artist; prolific?: ProlificMeta }
  | { role: "audience"; data: Audience };

export type PoemSnapshot = {
  action: "ADD" | "REMOVE";
  index: number;
  timestamp: Date;
};

export interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For multiple choice
  scale?: number; // For scale questions (e.g., 7-point scale)
}
