import express from "express";
import { db, FieldValue } from "../firebase/firebase";
import type { DocumentReference } from "firebase-admin/firestore";

const router = express.Router();

const ARTIST_COLLECTION = "artist";
const ARTIST_SURVEY_COLLECTION = "artistSurvey";
const POEM_COLLECTION = "poem";
const INCOMPLETE_SESSION_COLLECTION = "artistIncompleteSession";
const ASSIGNMENT_COLLECTION = "artistAssignment";
const DEFAULT_EXHIBITION_STUDY_ID = "6a8cbdb524cc2e2b32049b00";

const PUBLIC_OUTCOME_KEYS = new Set([
  "felt_emotion",
  "final_intended_meaning",
  "intended_emotion",
  "expressive_realization",
  "csi_able_to_be_creative",
  "csi_tools_allowed_expression",
  "ownership_own_work",
  "ownership_responsibility",
  "ownership_personal_connection",
  "ownership_emotional_connection",
  "creative_control",
  "creative_intentionality",
  "mental_effort",
  "llm_contribution_attribution",
  "would_repeat_activity",
  "ai_attitude",
]);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const toPublicJson = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toPublicJson);
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return value;

  const candidate = value as {
    toDate?: () => Date;
    path?: string;
  };
  if (typeof candidate.toDate === "function") {
    return candidate.toDate().toISOString();
  }
  if (candidate.path) return undefined;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, toPublicJson(item)] as const)
      .filter(([, item]) => item !== undefined),
  );
};

const filterPublicOutcomes = (answers: Record<string, unknown> = {}) =>
  Object.fromEntries(
    Object.entries(answers).filter(([key]) => PUBLIC_OUTCOME_KEYS.has(key)),
  );

const isDocumentReference = (value: unknown): value is DocumentReference =>
  Boolean(
    value &&
      typeof value === "object" &&
      "get" in value &&
      typeof (value as { get?: unknown }).get === "function",
  );

const publicConversation = (
  value: unknown,
  defaultStage: "SPARK" | "WRITE",
) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      const message = asRecord(item);
      if (message.role !== "user" && message.role !== "assistant") return null;
      if (typeof message.content !== "string") return null;
      return {
        id: `${defaultStage.toLowerCase()}-${index + 1}`,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp ?? null,
        stage:
          message.stage === "SPARK" || message.stage === "WRITE"
            ? message.stage
            : defaultStage,
        kind: typeof message.kind === "string" ? message.kind : null,
      };
    })
    .filter((message) => message !== null);
};

const publicLlmUsage = (value: unknown) => {
  const usage = asRecord(value);
  const chatOpenings = Array.isArray(usage.chatOpenings)
    ? usage.chatOpenings.map((item) => {
        const opening = asRecord(item);
        return { stage: opening.stage, timestamp: opening.timestamp };
      })
    : [];
  const chatAvailability = Array.isArray(usage.chatAvailability)
    ? usage.chatAvailability.map((item) => {
        const availability = asRecord(item);
        return {
          stage: availability.stage,
          availableAt: availability.availableAt,
        };
      })
    : [];
  const requests = Array.isArray(usage.requests)
    ? usage.requests.map((item) => {
        const request = asRecord(item);
        return {
          stage: request.stage,
          status: request.status,
          requestedAt: request.requestedAt,
          completedAt: request.completedAt,
          failedAt: request.failedAt,
        };
      })
    : [];
  return { chatOpenings, chatAvailability, requests };
};

const publicTimestampMs = (value: unknown) => {
  if (value instanceof Date) return value.getTime();
  const candidate = asRecord(value) as { toDate?: () => Date };
  if (typeof candidate.toDate === "function") return candidate.toDate().getTime();
  const parsed = new Date(String(value ?? "")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

router.get("/exhibition", async (req, res) => {
  try {
    const studyId = String(req.query.studyId ?? "");
    const allowedStudyIds = new Set(
      (process.env.EXHIBITION_STUDY_IDS ?? DEFAULT_EXHIBITION_STUDY_ID)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    );

    if (!studyId || !allowedStudyIds.has(studyId)) {
      return res.status(404).json({ error: "Exhibition not found" });
    }

    const artistSnapshot = await db
      .collection(ARTIST_COLLECTION)
      .where("prolific.studyId", "==", studyId)
      .get();

    const hydrated = await Promise.all(
      artistSnapshot.docs.map(async (artistDoc) => {
        const artist = artistDoc.data();
        const poemRef = artist.poem;
        const surveyRef = artist.surveyResponse;

        if (!isDocumentReference(poemRef) || !isDocumentReference(surveyRef)) {
          return null;
        }

        const [poemSnapshot, surveySnapshot] = await Promise.all([
          poemRef.get(),
          surveyRef.get(),
        ]);
        if (!poemSnapshot.exists || !surveySnapshot.exists) return null;

        const poem = poemSnapshot.data() ?? {};
        const survey = surveySnapshot.data() ?? {};
        const postSurveyAnswers = filterPublicOutcomes(
          (survey.postSurveyAnswers as Record<string, unknown>) ?? {},
        );
        const completionValue = Array.isArray(artist.timestamps)
          ? artist.timestamps[artist.timestamps.length - 1]
          : poem.taskTiming?.completedAt;

        const sparkConversation = publicConversation(
          poem.sparkConversation,
          "SPARK",
        );
        const writeConversation = publicConversation(
          poem.writeConversation,
          "WRITE",
        ).filter((message) => message?.stage !== "SPARK");

        return {
          condition: artist.condition,
          completedAt: completionValue ?? null,
          poem: {
            passageId: poem.passageId,
            passage: poem.passage,
            text: poem.text ?? poem.selectedWordIndexes ?? [],
            finalPoem: poem.finalPoem ?? "",
            editHistory: poem.editHistory ?? poem.snapshot ?? [],
            sparkConversation,
            writeConversation,
            taskTiming: poem.taskTiming ?? {},
            llmUsage: publicLlmUsage(poem.llmUsage),
            derivedMetrics: poem.derivedMetrics ?? {},
          },
          outcomes: postSurveyAnswers,
        };
      }),
    );

    const participants = hydrated
      .filter((participant) => participant !== null)
      .sort(
        (a, b) =>
          publicTimestampMs(a.completedAt) - publicTimestampMs(b.completedAt),
      )
      .map((participant, index) => ({
        id: `poem-${String(index + 1).padStart(2, "0")}`,
        ...participant,
      }));

    res.set("Cache-Control", "public, max-age=0, s-maxage=60");
    res.json(
      toPublicJson({
        studyId,
        generatedAt: new Date(),
        participants,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load exhibition" });
  }
});

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

        transaction.set(
          assignmentRef,
          {
            taskPassageId,
            tutorialPassageId: resolvedTutorialPassageId,
            passagePoolVersion: resolvedPassagePoolVersion,
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
          condition: "LLM" as const,
          strategy: "LLM_ONLY",
        };
      }

      const condition = "LLM" as const;
      const strategy = "LLM_ONLY";

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
    const payload: Record<string, unknown> = {
      sessionId,
      role: data.role,
      partialData: data.data,
      lastUpdated: FieldValue.serverTimestamp(),
      completionStatus: status,
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
