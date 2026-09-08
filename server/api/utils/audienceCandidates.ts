import { db } from "../firebase/firebase";
import { AUDIENCE_PASSAGE_POOL_VERSION, AUDIENCE_PASSAGE_ID_LIST } from "./audienceAssignment";
import { getFinalPoemText } from "./audienceInterpretations";
const ARTIST_COLLECTION = "artist";
const AUDIENCE_PASSAGE_IDS = new Set<string>(AUDIENCE_PASSAGE_ID_LIST);

// Real Prolific PIDs are a random string of letters/digits; anything with
// "test" in it (case-insensitive) was typed in by hand during development
// and shouldn't be treated as a real participant submission.
const isRealProlificId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  !value.toLowerCase().includes("test");

export interface AudienceCandidate {
  id: string;
  condition: "LLM" | "NO_AI";
  passageId: string;
  passage: {
    id: string;
    text: string;
    title: string;
    author: string;
    publication?: string;
  };
  selectedWordIndexes: number[];
  statement: string;
  finalPoemText: string;
  poemTextOrigin: "creator-final-text" | "source-word-indexes";
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

// Reads an artist's own "artist's statement" answer from their post-survey,
// checking both this branch's legacy `q14` field and the newer
// `final_intended_meaning` id.
const getStatement = (surveyData: Record<string, unknown> | undefined) => {
  const nestedSurveyResponse = asRecord(surveyData?.surveyResponse);
  const postAnswers =
    asRecord(surveyData?.postSurveyAnswers) ??
    asRecord(surveyData?.postAnswers) ??
    asRecord(nestedSurveyResponse?.postAnswers);
  const statement =
    postAnswers?.final_intended_meaning ?? postAnswers?.q14 ?? null;
  return typeof statement === "string" && statement.trim()
    ? statement.trim()
    : null;
};

export const loadAudienceCandidates = async (): Promise<AudienceCandidate[]> => {
  const artistSnapshot = await db
    .collection(ARTIST_COLLECTION)
    .where("condition", "in", ["LLM", "NO_AI"])
    .get();

  const candidates = await Promise.all(
    artistSnapshot.docs.map(async (artistDoc) => {
      const artistData = artistDoc.data();
      const condition = artistData.condition as "LLM" | "NO_AI";
      const passagePoolVersion = artistData.assignment?.passagePoolVersion;
      const poemRef = artistData.poem;
      const surveyRef = artistData.surveyResponse;
      if (
        passagePoolVersion !== AUDIENCE_PASSAGE_POOL_VERSION ||
        !poemRef ||
        !surveyRef ||
        !isRealProlificId(artistData.prolific?.prolificPid)
      ) {
        return null;
      }

      const [poemDoc, surveyDoc] = await Promise.all([
        poemRef.get(),
        surveyRef.get(),
      ]);
      if (!poemDoc.exists || !surveyDoc.exists) return null;

      const poemData = poemDoc.data();
      const passage = poemData?.passage;
      // Use the embedded passage, since some historical passageId fields
      // disagree with the source actually stored and rendered.
      const passageId = String(passage?.id ?? "");
      const statement = getStatement(surveyDoc.data());
      const selectedWordIndexes =
        poemData?.selectedWordIndexes ?? poemData?.text;

      if (
        !AUDIENCE_PASSAGE_IDS.has(passageId) ||
        !passage?.text ||
        !passage?.title ||
        !passage?.author ||
        !statement ||
        !Array.isArray(selectedWordIndexes) ||
        selectedWordIndexes.length === 0 ||
        !selectedWordIndexes.every((index: unknown) =>
          typeof index === "number" && Number.isInteger(index) && index >= 0 &&
          index < passage.text.split(" ").length)
      ) {
        return null;
      }

      return {
        id: poemDoc.id,
        condition,
        passageId,
        passage,
        selectedWordIndexes: [...new Set<number>(selectedWordIndexes)],
        statement,
        ...getFinalPoemText(passage.text, selectedWordIndexes, poemData?.finalPoemText),
      } satisfies AudienceCandidate;
    }),
  );

  return candidates.filter(
    (candidate): candidate is AudienceCandidate => candidate !== null,
  );
};
