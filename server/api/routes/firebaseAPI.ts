import express from "express";
import { db, FieldValue } from "../firebase/firebase";

const router = express.Router();

const ARTIST_COLLECTION = "artist";
const ARTIST_SURVEY_COLLECTION = "artistSurvey";
const POEM_COLLECTION = "poem";
const INCOMPLETE_SESSION_COLLECTION = "incompleteSession";
const AUDIENCE_COLLECTION = "audience";
const AUDIENCE_SURVEY_COLLECTION = "audienceSurvey";
const AUDIENCE_INCOMPLETE_SESSION_COLLECTION = "audienceIncompleteSession";

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
      (d: any) => d?.poemId ?? d
    );
  }
  return trimmed;
}

router.post("/autosave", async (req, res) => {
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
});

router.post("/commit-session", async (req, res) => {
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
    batch.set(poemRef, { artistId: artistRef.id, ...poemData });
    batch.delete(incompleteRef);

    await batch.commit();

    res.json({ success: true, artistId: artistRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Batch commit failed" });
  }
});

router.post("/commit-audience-session", async (req, res) => {
  try {
    const { audienceData, sessionId } = req.body;

    if (!audienceData) {
      return res.status(400).json({ error: "Missing audienceData" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const batch = db.batch();

    const audienceRef = db.collection(AUDIENCE_COLLECTION).doc();
    const surveyRef = db.collection(AUDIENCE_SURVEY_COLLECTION).doc();
    const incompleteRef = db
      .collection(AUDIENCE_INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);

    const { surveyResponse, ...audienceRest } = trimAudiencePoemRefs(audienceData);

    const audience = {
      ...audienceRest,
      surveyResponse: surveyRef,
      timeStamps: [...(audienceData.timeStamps ?? []), new Date()],
    };

    batch.set(audienceRef, audience);
    batch.set(surveyRef, { audienceId: audienceRef.id, ...surveyResponse });
    batch.delete(incompleteRef);

    await batch.commit();

    res.json({ success: true, audienceId: audienceRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Batch commit failed" });
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
  poemId: string
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
    ).filter(
      (s): s is { poemId: string; statement: string } => s !== null
    );

    // Shuffle so the option order doesn't reveal which poem a statement belongs to
    for (let i = poemStatements.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poemStatements[i], poemStatements[j]] = [
        poemStatements[j],
        poemStatements[i],
      ];
    }

    console.log("[artist-statements] real statements (from shown poems):", poemStatements);

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

    console.log("[distractor-statements] decoy poems/statements (not shown to this participant):", distractors);

    res.json({ distractors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get distractor statements" });
  }
});

export default router;
