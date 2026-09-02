import express from "express";
import { db, FieldValue } from "../firebase/firebase";
import {
  createArtistRoundIdentifiers,
  normalizePassageIds,
  resolveArtistRoundMetadata,
  TOTAL_ARTIST_POEMS,
} from "../utils/artistRounds";

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
      passageIds,
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

    const proposedPassageIds = normalizePassageIds(passageId, passageIds);
    if (proposedPassageIds.includes(String(tutorialPassageId))) {
      return res.status(400).json({
        error: "Tutorial passage must differ from poem passages",
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
        const existingPassageIds = Array.isArray(existing.passageIds)
          ? existing.passageIds
          : proposedPassageIds;
        const assignedPassageIds = normalizePassageIds(
          taskPassageId,
          existingPassageIds.filter(
            (id: unknown) => String(id) !== resolvedTutorialPassageId,
          ),
        );

        transaction.set(
          assignmentRef,
          {
            taskPassageId,
            tutorialPassageId: resolvedTutorialPassageId,
            passagePoolVersion: resolvedPassagePoolVersion,
            passageIds: assignedPassageIds,
            totalPoems: TOTAL_ARTIST_POEMS,
            condition: "LLM",
            strategy: "LLM_ONLY",
          },
          { merge: true },
        );

        return {
          passageId: taskPassageId,
          taskPassageId,
          tutorialPassageId: resolvedTutorialPassageId,
          passagePoolVersion: resolvedPassagePoolVersion,
          passageIds: assignedPassageIds,
          totalPoems: TOTAL_ARTIST_POEMS,
          condition: "LLM" as const,
          strategy: "LLM_ONLY",
        };
      }

      const condition = "LLM" as const;
      const strategy = "LLM_ONLY";

      transaction.set(assignmentRef, {
        sessionId,
        prolificPid: prolificPid || null,
        passageId: proposedPassageIds[0],
        taskPassageId: proposedPassageIds[0],
        tutorialPassageId: String(tutorialPassageId),
        passagePoolVersion: String(passagePoolVersion),
        passageIds: proposedPassageIds,
        totalPoems: TOTAL_ARTIST_POEMS,
        condition,
        strategy,
        assignedAt: FieldValue.serverTimestamp(),
      });

      return {
        passageId: proposedPassageIds[0],
        taskPassageId: proposedPassageIds[0],
        tutorialPassageId: String(tutorialPassageId),
        passagePoolVersion: String(passagePoolVersion),
        passageIds: proposedPassageIds,
        totalPoems: TOTAL_ARTIST_POEMS,
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

    const timestampsLength = Array.isArray(data.data?.timeStamps)
      ? data.data.timeStamps.length
      : 0;
    const poemNumber = Number(data.data?.poemNumber);
    let status = timestampsLength
      ? statusMap[timestampsLength] || "started"
      : "started";

    if (
      Number.isInteger(poemNumber) &&
      poemNumber >= 1 &&
      timestampsLength >= 5
    ) {
      const roundStartTimestampCount = 5 + (poemNumber - 1) * 2;
      const completedRoundSteps = timestampsLength - roundStartTimestampCount;
      status =
        completedRoundSteps <= 0
          ? `poem-${poemNumber}-ready`
          : completedRoundSteps === 1
            ? `poem-${poemNumber}-brainstorm-complete`
            : `poem-${poemNumber}-write-complete`;
    }

    const ref = db.collection(INCOMPLETE_SESSION_COLLECTION).doc(sessionId);
    const payload: Record<string, unknown> = {
      sessionId,
      role: data.role,
      partialData: data.data,
      lastUpdated: FieldValue.serverTimestamp(),
      completionStatus: status,
      poemNumber: Number.isInteger(poemNumber) ? poemNumber : null,
    };
    if (data.prolific) {
      payload.prolific = data.prolific;
    }

    await ref.set(payload, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to autosave" });
  }
});

router.post("/commit-session", async (req, res) => {
  try {
    const {
      artistData,
      surveyData,
      poemData,
      sessionId,
      prolific,
      poemNumber: requestedPoemNumber,
      totalPoems: requestedTotalPoems,
      isFinalPoem: requestedIsFinalPoem,
    } = req.body;

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

    const roundMetadata = resolveArtistRoundMetadata(
      requestedPoemNumber,
      requestedTotalPoems,
      requestedIsFinalPoem,
      artistData,
    );
    if (!roundMetadata) {
      return res.status(400).json({ error: "Invalid poem round metadata" });
    }
    const { poemNumber, totalPoems, isFinalPoem } = roundMetadata;

    const batch = db.batch();
    const { roundId, roundDocumentId } = createArtistRoundIdentifiers(
      String(sessionId),
      poemNumber,
    );
    const artistRef = db.collection(ARTIST_COLLECTION).doc(roundDocumentId);
    const surveyRef = db
      .collection(ARTIST_SURVEY_COLLECTION)
      .doc(roundDocumentId);
    const poemRef = db.collection(POEM_COLLECTION).doc(roundDocumentId);
    const incompleteRef = db
      .collection(INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);

    const artist: Record<string, unknown> = {
      condition: artistData.condition,
      assignment: artistData.assignment ?? null,
      surveyResponse: surveyRef,
      poem: poemRef,
      timestamps: [...(artistData.timeStamps ?? []), new Date()],
      participantSessionId: String(sessionId),
      roundId,
      poemNumber,
      totalPoems,
      isFinalPoem,
    };

    if (prolific) {
      artist.prolific = prolific;
    }

    batch.set(artistRef, artist);
    batch.set(surveyRef, {
      artistId: artistRef.id,
      participantSessionId: String(sessionId),
      roundId,
      poemNumber,
      totalPoems,
      ...surveyData,
    });
    batch.set(poemRef, {
      artistId: artistRef.id,
      participantSessionId: String(sessionId),
      roundId,
      poemNumber,
      totalPoems,
      ...poemData,
      random: Math.random(),
    });
    if (isFinalPoem) {
      batch.delete(incompleteRef);
    } else {
      batch.set(
        incompleteRef,
        {
          completedPoems: FieldValue.arrayUnion(poemNumber),
          completionStatus: `poem-${poemNumber}-complete`,
          lastUpdated: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    await batch.commit();

    res.json({
      success: true,
      artistId: artistRef.id,
      roundId,
      poemNumber,
      totalPoems,
      isFinalPoem,
    });
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
