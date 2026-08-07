import express from "express";
import { db, FieldValue } from "../firebase/firebase";

const router = express.Router();

// ARTIST COLLECTIONS
const ARTIST_COLLECTION = "artist";
const ARTIST_SURVEY_COLLECTION = "artistSurvey";
const POEM_COLLECTION = "poem";
const INCOMPLETE_SESSION_COLLECTION = "incompleteSession";
const AUDIENCE_COLLECTION = "audience";
const AUDIENCE_SURVEY_COLLECTION = "audienceSurvey";
const AUDIENCE_INCOMPLETE_SESSION_COLLECTION = "audienceIncompleteSession";

const AUDIENCE_PASSAGE_POOL_VERSION = "creator-passages-2026-08-05-v1";
const AUDIENCE_PASSAGE_ID_LIST = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "nyt-1",
  "nyt-2",
  "nyt-3",
  "nyt-4",
] as const;
const AUDIENCE_PASSAGE_IDS = new Set<string>(AUDIENCE_PASSAGE_ID_LIST);

interface AudienceCandidate {
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
}

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[otherIndex]] = [copy[otherIndex], copy[index]];
  }
  return copy;
};

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

const loadAudienceCandidates = async (): Promise<AudienceCandidate[]> => {
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
        !surveyRef
      ) {
        return null;
      }

      const [poemDoc, surveyDoc] = await Promise.all([
        poemRef.get(),
        surveyRef.get(),
      ]);
      if (!poemDoc.exists || !surveyDoc.exists) return null;

      const poemData = poemDoc.data();
      const passageId = String(
        poemData?.taskPassageId ?? poemData?.passageId ?? "",
      );
      const passage = poemData?.passage;
      const statement = getStatement(surveyDoc.data());
      const selectedWordIndexes =
        poemData?.selectedWordIndexes ?? poemData?.text;

      if (
        !AUDIENCE_PASSAGE_IDS.has(passageId) ||
        !passage?.text ||
        !passage?.title ||
        !passage?.author ||
        !statement ||
        !Array.isArray(selectedWordIndexes)
      ) {
        return null;
      }

      return {
        id: poemDoc.id,
        condition,
        passageId,
        passage,
        selectedWordIndexes: selectedWordIndexes.filter(Number.isInteger),
        statement,
      } satisfies AudienceCandidate;
    }),
  );

  return candidates.filter(
    (candidate): candidate is AudienceCandidate => candidate !== null,
  );
};

// Full poem content and distractor statement text already live in the
// poem/artistSurvey collections — only store the poem IDs on an audience
// record instead of duplicating that content every time.
function trimAudiencePoemRefs(audienceData: any) {
  const trimmed = { ...audienceData };
  if (Array.isArray(trimmed.poems)) {
    trimmed.poems = trimmed.poems.map((poem: any) => poem?.id ?? poem);
  }
  if (Array.isArray(trimmed.distractorStatements)) {
    trimmed.distractorStatements = trimmed.distractorStatements.map(
      (d: any) => d?.poemId ?? d,
    );
  }
  return trimmed;
}

// ARTIST + AUDIENCE ROUTES (shared autosave handler, branches by role)
const autosaveHandler: express.RequestHandler = async (req, res) => {
  try {
    const { sessionId, data } = req.body;

    if (!sessionId || !data) {
      return res
        .status(400)
        .json({ error: "Missing sessionId or data objects" });
    }

    const statusMap: Record<number, string> = {
      1: "captcha",
      2: "consent",
      3: "pre-survey",
      4: "brainstorm-instructions",
      5: "brainstorm",
      6: "write",
      7: "post-survey",
    };

    const status = data.data?.timeStamps
      ? statusMap[data.data.timeStamps.length] || "started"
      : "started";

    const partialData = trimAudiencePoemRefs(data.data);

    const incompleteCollection =
      data.role === "audience"
        ? AUDIENCE_INCOMPLETE_SESSION_COLLECTION
        : INCOMPLETE_SESSION_COLLECTION;

    const ref = db.collection(incompleteCollection).doc(sessionId);
    const payload = {
      sessionId,
      role: data.role,
      partialData,
      lastUpdated: FieldValue.serverTimestamp(),
      completionStatus: status,
    };

    await ref.set(payload, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to autosave" });
  }
};

router.post("/artist/autosave", autosaveHandler);
router.post("/audience/autosave", autosaveHandler);

router.post("/artist/commit-session", async (req, res) => {
  try {
    const { artistData, surveyData, poemData, sessionId } = req.body;

    if (!artistData) {
      return res.status(400).json({ error: "Missing artistData" });
    }

    if (!surveyData) {
      return res.status(400).json({ error: "Missing surveyData" });
    }

    if (!poemData) {
      return res.status(400).json({ error: "Missing poemData" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const batch = db.batch();

    const artistRef = db.collection(ARTIST_COLLECTION).doc();
    const surveyRef = db.collection(ARTIST_SURVEY_COLLECTION).doc();
    const poemRef = db.collection(POEM_COLLECTION).doc();
    const incompleteRef = db
      .collection(INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);

    const artist = {
      condition: artistData.condition,
      surveyResponse: surveyRef,
      poem: poemRef,
      timestamps: [...(artistData.timeStamps ?? []), new Date()],
    };

    batch.set(artistRef, artist);
    batch.set(surveyRef, { artistId: artistRef.id, ...surveyData });
    batch.set(poemRef, {
      artistId: artistRef.id,
      ...poemData,
      random: Math.random(),
    });
    batch.delete(incompleteRef);

    await batch.commit();

    res.json({ success: true, artistId: artistRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Batch commit failed" });
  }
});

// Build a fresh audience assignment: a passage with a balanced pool of real
// artist submissions, 4 focal poems (2 LLM + 2 NO_AI), and for each one a
// set of difficulty-matched decoy statements alongside the real one.
router.post("/audience-assignment", async (_req, res) => {
  try {
    const candidates = await loadAudienceCandidates();
    const candidatesByPassage = new Map<string, AudienceCandidate[]>();
    candidates.forEach((candidate) => {
      const passageCandidates = candidatesByPassage.get(candidate.passageId) ?? [];
      passageCandidates.push(candidate);
      candidatesByPassage.set(candidate.passageId, passageCandidates);
    });

    const eligiblePassages = shuffle(
      [...candidatesByPassage.entries()].filter(([, passageCandidates]) => {
        const llmCount = passageCandidates.filter(
          (candidate) => candidate.condition === "LLM",
        ).length;
        const noAiCount = passageCandidates.filter(
          (candidate) => candidate.condition === "NO_AI",
        ).length;
        return llmCount >= 2 && noAiCount >= 2 && passageCandidates.length >= 7;
      }),
    );

    if (eligiblePassages.length === 0) {
      return res.status(409).json({
        code: "INSUFFICIENT_AUDIENCE_POOL",
        error:
          "No current source passage has four balanced focal poems and three same-source decoys",
      });
    }

    const [passageId, passageCandidates] = eligiblePassages[0];
    const tutorialPassageId = shuffle(
      AUDIENCE_PASSAGE_ID_LIST.filter(
        (candidatePassageId) => candidatePassageId !== passageId,
      ),
    )[0];
    const focalCandidates = shuffle([
      ...shuffle(
        passageCandidates.filter((candidate) => candidate.condition === "LLM"),
      ).slice(0, 2),
      ...shuffle(
        passageCandidates.filter((candidate) => candidate.condition === "NO_AI"),
      ).slice(0, 2),
    ]);
    const focalIds = new Set(focalCandidates.map((candidate) => candidate.id));
    const decoyCandidates = passageCandidates.filter(
      (candidate) => !focalIds.has(candidate.id),
    );

    const statementTrials = focalCandidates.map((focal) => {
      const poemText = focal.selectedWordIndexes
        .map((index) => focal.passage.text.split(" ")[index])
        .filter(Boolean)
        .join(" ");
      const decoys = [...decoyCandidates]
        .sort(
          (left, right) =>
            decoyMatchScore(focal.statement, left.statement, poemText) -
            decoyMatchScore(focal.statement, right.statement, poemText),
        )
        .slice(0, 3);

      return {
        poemId: focal.id,
        options: shuffle([
          { id: focal.id, statement: focal.statement },
          ...decoys.map((decoy) => ({
            id: decoy.id,
            statement: decoy.statement,
          })),
        ]),
      };
    });

    const assignmentId = db.collection(AUDIENCE_COLLECTION).doc().id;
    res.json({
      id: assignmentId,
      passageId,
      tutorialPassageId,
      taskPassageId: passageId,
      passagePoolVersion: AUDIENCE_PASSAGE_POOL_VERSION,
      poems: focalCandidates.map((candidate) => ({
        id: candidate.id,
        passageId: candidate.passageId,
        passage: candidate.passage,
        selectedWordIndexes: candidate.selectedWordIndexes,
      })),
      statementTrials,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create audience assignment" });
  }
});

router.post("/commit-audience-session", async (req, res) => {
  try {
    const { audienceData, sessionId, prolific } = req.body;
    if (!audienceData || !sessionId) {
      return res
        .status(400)
        .json({ error: "Missing audienceData or sessionId" });
    }

    const assignment = audienceData.assignment;
    if (
      !assignment?.id ||
      !Array.isArray(assignment.poems) ||
      assignment.poems.length !== 4 ||
      assignment.passagePoolVersion !== AUDIENCE_PASSAGE_POOL_VERSION ||
      assignment.passageId !== assignment.taskPassageId ||
      assignment.tutorialPassageId === assignment.taskPassageId ||
      !AUDIENCE_PASSAGE_IDS.has(assignment.tutorialPassageId) ||
      !AUDIENCE_PASSAGE_IDS.has(assignment.taskPassageId)
    ) {
      return res.status(400).json({ error: "Invalid audience assignment" });
    }

    const batch = db.batch();
    const audienceRef = db.collection(AUDIENCE_COLLECTION).doc(assignment.id);
    const surveyRef = db.collection(AUDIENCE_SURVEY_COLLECTION).doc();
    const incompleteRef = db
      .collection(AUDIENCE_INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);
    const assignmentSummary = {
      id: assignment.id,
      passageId: assignment.passageId,
      tutorialPassageId: assignment.tutorialPassageId,
      taskPassageId: assignment.taskPassageId,
      passagePoolVersion: assignment.passagePoolVersion,
      poemIds: assignment.poems.map((poem: { id: string }) => poem.id),
      statementTrials: assignment.statementTrials.map(
        (trial: { poemId: string; options: Array<{ id: string }> }) => ({
          poemId: trial.poemId,
          optionIds: trial.options.map((option) => option.id),
        }),
      ),
    };
    const audienceRecord: Record<string, unknown> = {
      assignment: assignmentSummary,
      surveyResponse: surveyRef,
      timestamps: audienceData.timeStamps ?? [],
      completedAt: FieldValue.serverTimestamp(),
    };
    if (prolific) audienceRecord.prolific = prolific;

    batch.set(audienceRef, audienceRecord);
    batch.set(surveyRef, {
      audienceId: audienceRef.id,
      ...audienceData.surveyResponse,
    });
    batch.delete(incompleteRef);
    await batch.commit();

    res.json({ success: true, audienceId: audienceRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Audience batch commit failed" });
  }
});

const POEM_OVERVIEW_COLLECTION = "poemOverview";

// Fetch poems from Firebase filtered to LLM and NO_AI artist conditions
router.get("/audience-poems", async (req, res) => {
  try {
    const artistSnapshot = await db
      .collection(ARTIST_COLLECTION)
      .where("condition", "in", ["LLM", "NO_AI"])
      .get();

    if (artistSnapshot.empty) {
      return res.json({ poems: [] });
    }

    const poems: any[] = [];
    for (const artistDoc of artistSnapshot.docs) {
      const artistData = artistDoc.data();
      const poemRef = artistData.poem;
      if (!poemRef) continue;

      const poemDoc = await poemRef.get();
      if (!poemDoc.exists) continue;

      poems.push({
        id: poemDoc.id,
        artistId: artistDoc.id,
        condition: artistData.condition,
        ...poemDoc.data(),
      });
    }

    res.json({ poems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch audience poems" });
  }
});

// Get existing overview for a poem (returns null if not yet generated)
router.get("/poem-overview/:poemId", async (req, res) => {
  try {
    const { poemId } = req.params;
    const doc = await db.collection(POEM_OVERVIEW_COLLECTION).doc(poemId).get();
    if (!doc.exists) {
      return res.json({ overview: null });
    }
    res.json({ overview: doc.data()?.overview ?? null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch poem overview" });
  }
});

// Store a generated overview for a poem
router.post("/poem-overview/:poemId", async (req, res) => {
  try {
    const { poemId } = req.params;
    const { overview } = req.body;
    if (!overview) {
      return res.status(400).json({ error: "Missing overview" });
    }
    await db
      .collection(POEM_OVERVIEW_COLLECTION)
      .doc(poemId)
      .set({ overview, createdAt: FieldValue.serverTimestamp() });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to store poem overview" });
  }
});

// Look up an artist's own statement about their poem (from their post-survey)
async function getStatementForArtist(artistId: string): Promise<string | null> {
  const surveySnapshot = await db
    .collection(ARTIST_SURVEY_COLLECTION)
    .where("artistId", "==", artistId)
    .limit(1)
    .get();
  if (surveySnapshot.empty) return null;

  return surveySnapshot.docs[0].data()?.postSurveyAnswers?.q14 ?? null;
}

async function getArtistStatement(
  poemId: string,
): Promise<{ poemId: string; statement: string } | null> {
  const poemDoc = await db.collection(POEM_COLLECTION).doc(poemId).get();
  if (!poemDoc.exists) return null;

  const artistId = poemDoc.data()?.artistId;
  if (!artistId) return null;

  const statement = await getStatementForArtist(artistId);
  if (!statement) return null;

  return { poemId, statement };
}

// Get the real artist statements for a set of poems, for the audience
// "guess which statement matches which poem" question
router.post("/audience/artist-statements", async (req, res) => {
  try {
    const { poemIds } = req.body;
    if (!Array.isArray(poemIds) || poemIds.length === 0) {
      return res.status(400).json({ error: "Missing poemIds" });
    }

    const poemStatements = (
      await Promise.all(poemIds.map((id: string) => getArtistStatement(id)))
    ).filter((s): s is { poemId: string; statement: string } => s !== null);

    // Shuffle so the option order doesn't reveal which poem a statement belongs to
    for (let i = poemStatements.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poemStatements[i], poemStatements[j]] = [
        poemStatements[j],
        poemStatements[i],
      ];
    }

    console.log(
      "[artist-statements] real statements (from shown poems):",
      poemStatements,
    );

    res.json({ poemStatements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get artist statements" });
  }
});

// Get statements from OTHER poems (not the ones being shown), to use as
// decoy options alongside the real statements above
router.post("/audience/distractor-statements", async (req, res) => {
  try {
    const { excludePoemIds, count = 4 } = req.body;
    if (!Array.isArray(excludePoemIds)) {
      return res.status(400).json({ error: "Missing excludePoemIds" });
    }

    const excludeSet = new Set(excludePoemIds);
    const artistSnapshot = await db
      .collection(ARTIST_COLLECTION)
      .where("condition", "in", ["LLM", "NO_AI"])
      .get();

    const candidates: { poemId: string; artistId: string }[] = [];
    for (const artistDoc of artistSnapshot.docs) {
      const poemRef = artistDoc.data().poem;
      if (!poemRef || excludeSet.has(poemRef.id)) continue;
      candidates.push({ poemId: poemRef.id, artistId: artistDoc.id });
    }

    // Fisher-Yates shuffle so the same decoys aren't always picked
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const distractors: { poemId: string; statement: string }[] = [];
    for (const candidate of candidates) {
      if (distractors.length >= count) break;
      const statement = await getStatementForArtist(candidate.artistId);
      if (statement) distractors.push({ poemId: candidate.poemId, statement });
    }

    console.log(
      "[distractor-statements] decoy poems/statements (not shown to this participant):",
      distractors,
    );

    res.json({ distractors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get distractor statements" });
  }
});

export default router;
