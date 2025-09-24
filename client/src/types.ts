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

// export interface SurveyQuestion {
//   id: string;
//   q: string;
//   answerType:
// }

export interface Poem {
  passageId: string; // passageId in Passage.id
  text: number[]; // this array holds the indexes of each word chosen from the passage
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
  | "topXRanking";

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
  required?: boolean;
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
  scaleMin: number;
  scaleMax: number;
  labels?: { min: string; max: string };
}

export type Question =
  | MultipleChoiceQuestion
  | OpenEndedQuestion
  | LikertScaleQuestion
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

export type AnswerValue = string | string[] | number | null;

export interface SurveyAnswers {
  [questionId: string]: AnswerValue;
}

export interface TopXRankingQuestion extends BaseQuestion {
  type: "topXRanking";
  options: string[];
  maxSelectable: number; // maximum number of selectable options
}

export type UserData =
  | { role: "artist"; data: Artist }
  | { role: "audience"; data: Audience };

export interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For multiple choice
  scale?: number; // For scale questions (e.g., 7-point scale)
}
