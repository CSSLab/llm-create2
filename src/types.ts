// ARTIST TYPES
export interface Artist {
  condition: ArtistCondition;
  surveyResponse: ArtistSurvey;
  poem: Poem;
  timeStamps: Date[];
}

export interface ArtistSurvey {
  q1: string;
  q2: string;
  q3: string;
  q4: string;

  // // Pre-survey
  // preDemographic1: number;
  // preDemographic2: number;
  // prePANAS: number[];
  // // Post-survey
  // postDemographic1: number;
  // postPANAS: number[];
  // intentions1: string;
  // intentions2: number[];
  // ownership1: number;
  // ownership2: number;
  // ownership3: number;
  // aiHelpfulness: number;
  // creditAttribution: number;
  // aiOpinion: number;
}

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
  text: string;
  timestamp: Date;
}

export interface Passage {
  id: string;
  text: string;
}

export const ArtistCondition = {
  CONTROL: "CONTROL",
  SPARK: "SPARK",
  WRITING: "WRITING",
  TOTAL_ACCESS: "TOTAL_ACCESS",
} as const;
export type ArtistCondition =
  (typeof ArtistCondition)[keyof typeof ArtistCondition];

export const Role = {
  ARTIST: "ARTIST",
  LLM: "LLM",
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
  q1: string;
  q10: string;
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

export type UserData =
  | { role: "artist"; data: Artist }
  | { role: "audience"; data: Audience };

export type QuestionType = "multiple" | "text";

export interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For multiple choice
  scale?: number; // For scale questions (e.g., 7-point scale)
}
