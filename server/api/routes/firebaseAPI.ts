import { loadAudiencePilot, AUDIENCE_PILOT_ID } from "../utils/audiencePilot";
import { isDeepStrictEqual } from "node:util";
import {
  INTERPRETATION_COLLECTION,
  interpretationIdentity,
  isReadyInterpretation,
} from "../utils/audienceInterpretations";
import {
  assignInterpretationCondition,
  INTERPRETATION_DISPLAY,
} from "../utils/audienceInterpretationProtocol";
import express from "express";
import {
  AUDIENCE_PROTOCOL_VERSION,
  AUDIENCE_PREVIOUS_PROTOCOL_VERSION,
  AUDIENCE_PRESENTATION,
  hasAudienceInterpretations,
  AUDIENCE_SAMPLING_STRATEGY,
  AUDIENCE_PASSAGE_POOL_VERSION,
  AUDIENCE_PASSAGE_ID_LIST,
  shuffle,
  sampleAudienceCandidates,
  isValidAudienceAssignment,
  hasCompleteCreativityRatings,
  hasCompleteInterpretationExposure,
} from "../utils/audienceAssignment";
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

// Tags audience records with which pilot round produced them, so different
// rounds (different assignment logic, decoy pools, etc.) can be told apart
// later in Firestore. Set via server/.env - bump it there and restart the
// server when starting a new pilot round.
const AUDIENCE_PILOT_VERSION =
  process.env.AUDIENCE_PILOT_VERSION ?? AUDIENCE_PILOT_ID;

// Temporary hand-written decoys, kept in sync with the client preview.
// Each trial uses decoys for its own source passage.
export const PASSAGE_DISTRACTOR_STATEMENTS: Record<string, string[]> = {
  // The Secret Garden - awakening senses, secrecy, hushed anticipation
  "3": [
    "For the most part, this poem is about senses waking up all at once after being shut off for a long time.",
    "I wanted to express the hush that comes right before something wonderful happens",
    "This is about a fragile body finally catching up to a world it's only just starting to notice",
    "A private thrill, kept quiet on purpose",
    "Capture the difference between looking and truly listening",
    "I wanted the poem to feel like a held breath",
    "I kept coming back to the idea of tiptoeing somewhere you're not sure you're allowed to be.",
  ],
  // Ballet Shoes - domestic joy, unexpected contentment
  "4": [
    "I was trying to explore how ordinary routines can turn into the best part of a day.",
    "You can feel the comfort of shared chores and simple mornings underneath all of it",
    "The poem explores contentment that sneaks up on you when you weren't expecting a good time at all",
    "Repeating small rituals as a sort of happiness",
    "There's a kind of ease I wanted the reader to sit with, the sense that a place can start to feel like home almost by accident.",
    "What does it mean when the people around you turn into easy companions without either of you noticing?",
    "A lazy, satisfied morning",
  ],
  // Anne of Green Gables - dreaming beyond the mundane, youthful possibility
  "2": [
    "I kept thinking about the pull of imagining a future bigger than the room you're sitting in while choosing these words",
    "This is about drifting into hope while everyone around you is talking about small things.",
    "I wanted to express the gap between practical chatter and a private sweeping sense of possibility",
    "my idea was to capture daydreams that feel like certainty",
    "Youth is the permission to imagine",
    "this poem is quiet ambition dressed up as idle conversation.",
    "I wanted the poem to feel like watching a sunset and mistaking it for a promise.",
  ],
  // The God of Small Things - homecoming, decay and renewal, weather's power
  "1": [
    "The poem explores what it feels like to return to a place that has changed without you.",
    "The idea that weather can rewrite a landscape almost overnight",
    "You can feel a house aging right along with the people who left it underneath all of it.",
    "Old walls that still hold on to the past",
    "I wanted to express how memory clings to a place the way dampness clings to stone.",
    "What does an uneasy homecoming feel like once you're standing back inside it?",
    "There's a kind of familiar-but-wrong feeling I wanted the reader to sit with",
  ],
  // The House of Spirits - contained passion, unmet potential
  "5": [
    "This is about a love too large for the small life it was given.",
    "I was trying to convey how someone can be capable of enormous feeling and still end up isolated.",
    "My goal was to capture the mismatch between what a person is capable of and the life circumstance hands them",
    "Too much feeling in too little room.",
    "I kept thinking about the difference between grand emotion and everyday warmth",
    "I wanted the poem to feel like a fire kept banked instead of let out.",
    "this poem is quiet devotion with nowhere left to go.",
  ],
  // "If It's Possible, It Happened" - chance, parallel fates, mortality
  "nyt-1": [
    "I wanted to express how close we all are, constantly, to an ending we never see.",
    "What if every possible outcome actually happened, and we only remember the one we survived?",
    "Luck, but treated more like a math problem instead of a personal story",
    "I kept coming back to the idea of every version of the story happening at once.",
    "There's a kind of vertigo I wanted the reader to sit with, the feeling of many futures collapsing into one.",
    "the poem explores how much of survival really just comes down to timing.",
    "You can feel a near-miss replaying itself underneath all of it",
  ],
  // "At Coachella, It's A Guy Thing" - performance of image, indulgence and its aftermath
  "nyt-2": [
    "this poem is about how much effort goes into looking like you're not trying.",
    "I kept thinking about the performance underneath a crowd that thinks it's just having fun while choosing these words.",
    "This is about the gap between how a moment looks and how it actually feels the morning after",
    "Curated carelessness",
    "I was trying to convey how identity gets assembled out of borrowed pieces",
    "i was envisioning a sort of restless kind of self-consciousness",
    "I wanted the poem to feel like a party photographed a beat too late",
  ],
  // "They Hook You When You're Young" - childhood shaping adult identity
  "nyt-3": [
    "How does something small from childhood end up quietly deciding who we become?",
    "The poem explores loyalty as something we inherit more than choose",
    "You can feel an old pattern, set young and followed for decades, underneath everything",
    "a habit formed early, never questioned since.",
    "I wanted to express how data can explain something as personal as devotion",
    "I kept coming back to the idea of inherited attachment as I worked on this",
    "There's a kind of grown-up habit I wanted the reader to sit with. One that traces straight back to a much younger version of yourself.",
  ],
  // "Yet Another Pretty Face" - fame, scrutiny, reinvention, ephemerality
  "nyt-4": [
    "I was trying to convey how being looked at constantly can start to feel like a kind of erasure",
    "this is about the pressure of being ranked and measured against everyone else in the room.",
    "My goal was to capture what it costs to keep reinventing yourself for an audience that's always watching",
    "Famous for a moment, but judged forever.",
    "I wanted to express the difference between being seen and being truly known",
    "I wanted the poem to feel like flipping through a magazine and forgetting the face on the cover by the next page",
    "restless ambition dressed up as confidence",
  ],
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
  const overlap = statementTokens.filter((token) =>
    poemTokens.has(token),
  ).length;
  const positive = statementTokens.filter((token) =>
    POSITIVE_WORDS.has(token),
  ).length;
  const negative = statementTokens.filter((token) =>
    NEGATIVE_WORDS.has(token),
  ).length;
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
    if (data.role === "audience" && data.data?.assignment?.preview) {
      return res
        .status(400)
        .json({ error: "Preview responses are not study data" });
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

    const audienceStatusMap: Record<number, string> = {
      1: "captcha",
      2: "consent",
      3: "reading",
      4: "statement-match",
      5: "ai-detection",
      6: "post-survey",
      7: "submitted",
    };
    const currentStatusMap =
      data.role === "audience" &&
      (hasAudienceInterpretations(data.data?.assignment?.protocolVersion) ||
        data.data?.assignment?.protocolVersion ===
          AUDIENCE_PREVIOUS_PROTOCOL_VERSION)
        ? audienceStatusMap
        : statusMap;
    const status = data.data?.timeStamps
      ? currentStatusMap[data.data.timeStamps.length] || "started"
      : "started";

    const partialData = trimAudiencePoemRefs(data.data);

    const incompleteCollection =
      data.role === "audience"
        ? AUDIENCE_INCOMPLETE_SESSION_COLLECTION
        : INCOMPLETE_SESSION_COLLECTION;

    const ref = db.collection(incompleteCollection).doc(sessionId);
    const payload: Record<string, unknown> = {
      sessionId,
      role: data.role,
      partialData,
      lastUpdated: FieldValue.serverTimestamp(),
      completionStatus: status,
    };
    if (data.role === "audience") {
      payload.audiencePilotVersion = AUDIENCE_PILOT_VERSION;
    }

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
    batch.set(poemRef, { artistId: artistRef.id, ...poemData });
    batch.delete(incompleteRef);

    await batch.commit();

    res.json({ success: true, artistId: artistRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Batch commit failed" });
  }
});

// Sample two distinct poems per condition across all eligible passages, then
// randomize their presentation order. Source passages may repeat; poems do not.
// Creator condition remains server-side and can be joined by poem ID in analysis.
async function audienceAssignmentHandler(
  req: express.Request,
  res: express.Response,
  preview = false,
) {
  try {
    if (
      preview &&
      req.body?.interpretationCondition !== undefined &&
      !["AI", "NO_AI"].includes(req.body.interpretationCondition)
    ) {
      return res.status(400).json({ error: "Invalid preview condition" });
    }
    const pilot = await loadAudiencePilot();
    if (
      !pilot ||
      pilot.poems.some(
        (candidate) =>
          (PASSAGE_DISTRACTOR_STATEMENTS[candidate.passageId]?.length ?? 0) < 3,
      )
    ) {
      return res
        .status(409)
        .json({
          code: "AUDIENCE_PILOT_NOT_READY",
          error: "The audience pilot has not been prepared",
        });
    }
    const candidates = pilot.poems;
    const focalCandidates = sampleAudienceCandidates(candidates);
    if (!focalCandidates) {
      return res.status(409).json({
        code: "INSUFFICIENT_AUDIENCE_POOL",
        error:
          "At least two AI and two non-AI poems from real, non-test Prolific submissions are required",
      });
    }
    // Require readiness across the entire eligible pool, before assigning an
    // audience condition. Missing generations must not alter poem eligibility.
    const interpretations = new Map<string, { id: string; text: string }>();
    await Promise.all(
      candidates.map(async (poem) => {
        const record = await db
          .collection(INTERPRETATION_COLLECTION)
          .doc(interpretationIdentity(poem).id)
          .get();
        const data = record.data();
        if (isReadyInterpretation(data, poem))
          interpretations.set(poem.id, data);
      }),
    );
    if (candidates.some((poem) => !interpretations.has(poem.id))) {
      return res
        .status(409)
        .json({
          code: "AUDIENCE_INTERPRETATIONS_NOT_READY",
          error:
            "Poem preparation is not complete. Please contact the study administrator.",
        });
    }
    const interpretationCondition =
      preview && req.body?.interpretationCondition
        ? req.body.interpretationCondition
        : assignInterpretationCondition();
    const roundPassageIds = focalCandidates.map(
      (candidate) => candidate.passageId,
    );
    const tutorialPassageId = shuffle(
      AUDIENCE_PASSAGE_ID_LIST.filter((id) => !roundPassageIds.includes(id)),
    )[0];

    const statementTrials = focalCandidates.map((focal) => {
      const staticDecoyCandidates = PASSAGE_DISTRACTOR_STATEMENTS[
        focal.passageId
      ].map((statement, index) => ({
        id: `static-decoy-${focal.passageId}-${index + 1}`,
        statement,
      }));
      const poemText = focal.selectedWordIndexes
        .map((index) => focal.passage.text.split(" ")[index])
        .filter(Boolean)
        .join(" ");
      const decoys = [...staticDecoyCandidates]
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

    const assignmentId = `${preview ? "preview-" : ""}${db.collection(AUDIENCE_COLLECTION).doc().id}`;
    const assignment = {
      id: assignmentId,
      pilotId: pilot.id,
      poolHash: pilot.poolHash,
      ...(preview && { preview: true }),
      protocolVersion: AUDIENCE_PROTOCOL_VERSION,
      presentationVersion: AUDIENCE_PRESENTATION,
      samplingStrategy: AUDIENCE_SAMPLING_STRATEGY,
      interpretationCondition,
      interpretationDisplayVersion: INTERPRETATION_DISPLAY.version,
      roundPassageIds,
      tutorialPassageId,
      passagePoolVersion: AUDIENCE_PASSAGE_POOL_VERSION,
      poems: focalCandidates.map((candidate) => ({
        id: candidate.id,
        passageId: candidate.passageId,
        passage: candidate.passage,
        selectedWordIndexes: candidate.selectedWordIndexes,
        interpretationId: interpretations.get(candidate.id)!.id,
        ...(interpretationCondition === "AI" && {
          interpretationText: interpretations.get(candidate.id)!.text,
        }),
      })),
      statementTrials,
    };
    // Fix the randomization and stimuli server-side before the participant starts.
    if (!preview) {
      await db
        .collection("audienceAssignment")
        .doc(assignmentId)
        .create({
          assignment,
          createdAt: FieldValue.serverTimestamp(),
          audiencePilotVersion: AUDIENCE_PILOT_VERSION,
        });
    }
    res.json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create audience assignment" });
  }
}

router.post("/audience-assignment", (req, res) =>
  audienceAssignmentHandler(req, res),
);
router.post("/audience-preview-assignment", (req, res) =>
  audienceAssignmentHandler(req, res, true),
);

router.post("/commit-audience-session", async (req, res) => {
  try {
    const { audienceData, sessionId, prolific } = req.body;
    if (!audienceData || !sessionId) {
      return res
        .status(400)
        .json({ error: "Missing audienceData or sessionId" });
    }

    const assignment = audienceData.assignment;
    if (assignment?.preview || !isValidAudienceAssignment(assignment)) {
      return res.status(400).json({ error: "Invalid audience assignment" });
    }
    if (
      assignment.protocolVersion &&
      !hasCompleteCreativityRatings(
        audienceData.surveyResponse,
        assignment.poems.map((poem: { id: string }) => poem.id),
      )
    ) {
      return res
        .status(400)
        .json({ error: "Missing or inconsistent poem creativity ratings" });
    }
    if (hasAudienceInterpretations(assignment.protocolVersion)) {
      const stored = await db
        .collection("audienceAssignment")
        .doc(assignment.id)
        .get();
      if (
        !isDeepStrictEqual(stored.data()?.assignment, assignment) ||
        !hasCompleteInterpretationExposure(
          audienceData.surveyResponse,
          assignment,
        )
      ) {
        return res
          .status(400)
          .json({
            error: "Invalid assignment or interpretation exposure records",
          });
      }
    }

    const batch = db.batch();
    const audienceRef = db.collection(AUDIENCE_COLLECTION).doc(assignment.id);
    const surveyRef = db.collection(AUDIENCE_SURVEY_COLLECTION).doc();
    const incompleteRef = db
      .collection(AUDIENCE_INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);
    const assignmentSummary = {
      id: assignment.id,
      ...(assignment.pilotId && {
        pilotId: assignment.pilotId,
        poolHash: assignment.poolHash,
      }),
      ...(assignment.protocolVersion
        ? {
            protocolVersion: assignment.protocolVersion,
            samplingStrategy: assignment.samplingStrategy,
            ...(assignment.presentationVersion && {
              presentationVersion: assignment.presentationVersion,
            }),
            ...(hasAudienceInterpretations(assignment.protocolVersion) && {
              interpretationCondition: assignment.interpretationCondition,
              interpretationDisplayVersion:
                assignment.interpretationDisplayVersion,
            }),
          }
        : {
            passageId: assignment.passageId,
            taskPassageId: assignment.taskPassageId,
          }),
      tutorialPassageId: assignment.tutorialPassageId,
      roundPassageIds: assignment.poems.map(
        (poem: { passageId: string }) => poem.passageId,
      ),
      rounds: assignment.poems.map(
        (
          poem: { id: string; passageId: string; interpretationId?: string },
          index: number,
        ) => ({
          round: index + 1,
          poemId: poem.id,
          passageId: poem.passageId,
          ...(poem.interpretationId && {
            interpretationId: poem.interpretationId,
          }),
        }),
      ),
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
      audiencePilotVersion: AUDIENCE_PILOT_VERSION,
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
