// ARTIST TYPES
export interface Artist {
  id: string
  condition: ArtistCondition
  surveyResponse: ArtistSurvey
  poem: Poem
}

// TODO: Exact survey questions tbd
export interface ArtistSurvey {
  id: string
  q1: string
  q10: string
}

export interface Poem {
  id: string
  passageId: string // passageId in Passage.id
  text: number[] // this array holds the indexes of each word chosen from the passage
  llmConversation: Message[]
}

export interface Message {
  id: string
  role: Role
  message: string
  timestamp: Date
}

export interface Passage {
  id: string
  text: string
}

export const ArtistCondition = {
  CONTROL: 'CONTROL',
  SPARK: 'SPARK',
  WRITING: 'WRITING',
  TOTAL_ACCESS: 'TOTAL_ACCESS'
} as const;
export type ArtistCondition = typeof ArtistCondition[keyof typeof ArtistCondition];

export const Role = {
  ARTIST: 'ARTIST',
  LLM: 'LLM'
} as const;
export type Role = typeof Role[keyof typeof Role];

// AUDIENCE TYPES
export interface Audience {
  id: string
  condition: AudienceCondition
  surveyResponse: AudienceSurvey
  poemFeedback: PoemFeedback
}

// TODO: Exact survey questions tbd
export interface AudienceSurvey {
  id: string
  q1: string
  q10: string
}

// TODO: Exact poem feedback fields tbd
export interface PoemFeedback {
  id: string
  poemId: string
  rating: number
}

export const AudienceCondition = {
  NO_KNOWLEDGE: 'NO_KNOWLEDGE',
  FULL_TRANSPARENCY: 'FULL_TRANSPARENCY'
} as const;
export type AudienceCondition = typeof AudienceCondition[keyof typeof AudienceCondition];

export type UserData = 
  | { role: 'artist'; data: Artist }
  | { role: 'audience'; data: Audience };
