import express from "express";
import { db, FieldValue } from "../firebase/firebase";

const router = express.Router();

const ARTIST_COLLECTION = "artist";
const ARTIST_SURVEY_COLLECTION = "artistSurvey";
const POEM_COLLECTION = "poem";
const INCOMPLETE_SESSION_COLLECTION = "incompleteSession";

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

    const ref = db.collection(INCOMPLETE_SESSION_COLLECTION).doc(sessionId);
    const payload = {
      sessionId,
      role: data.role,
      partialData: data.data,
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

      poems.push({ id: poemDoc.id, artistId: artistDoc.id, ...poemDoc.data() });
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

export default router;
