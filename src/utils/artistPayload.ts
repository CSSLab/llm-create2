import type {
  Artist,
  Message,
  ProlificMeta,
  SurveyAnswers,
  SurveyDefinition,
} from "../types";
import { deriveArtistMetrics, getFinalPoemText } from "./artistMetrics";

interface ArtistSurveyPayload {
  preSurvey: SurveyDefinition;
  preSurveyAnswers: SurveyAnswers;
  postSurvey: SurveyDefinition;
  postSurveyAnswers: SurveyAnswers;
  poemNumber: number;
  totalPoems: number;
}

interface CreateArtistCommitRequestOptions {
  artistData: Artist;
  surveyData: ArtistSurveyPayload;
  sessionId: string;
  prolific: ProlificMeta | null;
  poemNumber: number;
  totalPoems: number;
  isFinalPoem: boolean;
}

export const getUniquePoemConversation = (
  sparkConversation: Message[] = [],
  writeConversation: Message[] = [],
) => {
  const messagesById = new Map<string, Message>();
  [...sparkConversation, ...writeConversation].forEach((message) =>
    messagesById.set(message.id, message),
  );
  return [...messagesById.values()];
};

/**
 * Builds a compact wire payload. The API expands compatibility aliases before
 * writing Firestore, so no stored fields or measures are lost.
 */
export const createArtistCommitRequest = ({
  artistData,
  surveyData,
  sessionId,
  prolific,
  poemNumber,
  totalPoems,
  isFinalPoem,
}: CreateArtistCommitRequestOptions) => {
  const poem = artistData.poem;
  const conversation = getUniquePoemConversation(
    poem.sparkConversation,
    poem.writeConversation,
  );

  return {
    artistData: {
      condition: artistData.condition,
      assignment: artistData.assignment ?? null,
      timeStamps: artistData.timeStamps,
      poemNumber,
      totalPoems,
    },
    surveyData,
    poemData: {
      loggingSchemaVersion: poem.loggingSchemaVersion,
      passageId: poem.passageId,
      tutorialPassageId: artistData.assignment?.tutorialPassageId,
      taskPassageId: poem.passageId,
      passage: poem.passage,
      selectedWordIndexes: poem.text,
      finalPoem: getFinalPoemText(poem),
      editHistory: poem.poemSnapshot,
      conversation,
      sparkNotes: poem.sparkNotes,
      writeNotes: poem.writeNotes,
      taskTiming: poem.taskTiming,
      llmUsage: poem.llmUsage,
      derivedMetrics: deriveArtistMetrics(poem),
      poemNumber,
      totalPoems,
    },
    sessionId,
    prolific,
    poemNumber,
    totalPoems,
    isFinalPoem,
  };
};
