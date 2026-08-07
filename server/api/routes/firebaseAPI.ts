import express from "express";
import { db, FieldValue } from "../firebase/firebase";

const router = express.Router();

const ARTIST_COLLECTION = "artist";
const ARTIST_SURVEY_COLLECTION = "artistSurvey";
const POEM_COLLECTION = "poem";
const INCOMPLETE_SESSION_COLLECTION = "artistIncompleteSession";
const ASSIGNMENT_COLLECTION = "artistAssignment";

router.post("/artist-assignment", async (req, res) => {
  try {
    const {
      sessionId,
      passageId,
      tutorialPassageId,
      passagePoolVersion,
      prolificPid,
    } = req.body;
    if (
      !sessionId ||
      !passageId ||
      !tutorialPassageId ||
      !passagePoolVersion
    ) {
      return res.status(400).json({
        error:
          "Missing sessionId, passageId, tutorialPassageId, or passagePoolVersion",
      });
    }

    const assignmentRef = db.collection(ASSIGNMENT_COLLECTION).doc(sessionId);
    const assignment = await db.runTransaction(async (transaction) => {
      const existingAssignment = await transaction.get(assignmentRef);
      if (existingAssignment.exists) {
        const existing = existingAssignment.data()!;
        const taskPassageId = String(
          existing.taskPassageId ?? existing.passageId,
        );
        const resolvedTutorialPassageId = String(
          existing.tutorialPassageId ??
            (tutorialPassageId === taskPassageId
              ? passageId
              : tutorialPassageId),
        );
        const resolvedPassagePoolVersion = String(
          existing.passagePoolVersion ?? "legacy-creator-passages",
        );

        if (
          !existing.taskPassageId ||
          !existing.tutorialPassageId ||
          !existing.passagePoolVersion
        ) {
          transaction.set(
            assignmentRef,
            {
              taskPassageId,
              tutorialPassageId: resolvedTutorialPassageId,
              passagePoolVersion: resolvedPassagePoolVersion,
            },
            { merge: true },
          );
        }

        return {
          passageId: taskPassageId,
          taskPassageId,
          tutorialPassageId: resolvedTutorialPassageId,
          passagePoolVersion: resolvedPassagePoolVersion,
          condition: existing.condition as "LLM" | "NO_AI",
          strategy: existing.strategy as string,
        };
      }

      const condition: "LLM" | "NO_AI" =
        Math.random() < 0.5 ? "LLM" : "NO_AI";
      const strategy = "INDEPENDENT_RANDOM_1_TO_1";

      transaction.set(assignmentRef, {
        sessionId,
        prolificPid: prolificPid || null,
        passageId: String(passageId),
        taskPassageId: String(passageId),
        tutorialPassageId: String(tutorialPassageId),
        passagePoolVersion: String(passagePoolVersion),
        condition,
        strategy,
        assignedAt: FieldValue.serverTimestamp(),
      });

      return {
        passageId: String(passageId),
        taskPassageId: String(passageId),
        tutorialPassageId: String(tutorialPassageId),
        passagePoolVersion: String(passagePoolVersion),
        condition,
        strategy,
      };
    });

    res.json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to assign study condition" });
  }
});

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
      4: "instructions",
      5: "tutorial",
      6: "brainstorm",
      7: "write",
      8: "post-survey",
      9: "thank-you",
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
    const { artistData, surveyData, poemData, sessionId, prolific } = req.body;

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

    const artist: Record<string, unknown> = {
      condition: artistData.condition,
      assignment: artistData.assignment ?? null,
      surveyResponse: surveyRef,
      poem: poemRef,
      timestamps: [...(artistData.timeStamps ?? []), new Date()],
    };

    if (prolific) {
      artist.prolific = prolific;
    }

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

router.get("/participant-condition", async (req, res) => {
  try {
    const { prolificPid } = req.query;
    if (!prolificPid || typeof prolificPid !== "string") {
      return res.status(400).json({ error: "Missing prolificPid" });
    }

    const snapshot = await db
      .collection(ARTIST_COLLECTION)
      .where("prolific.prolificPid", "==", prolificPid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ condition: null });
    }

    const condition = snapshot.docs[0].data().condition ?? null;
    res.json({ condition });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to look up participant condition" });
  }
});

export default router;
