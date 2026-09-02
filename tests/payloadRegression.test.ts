import { describe, expect, it } from "vitest";
import express from "express";
import {
  BLACKOUT_ASSISTANT_PROMPT_DEFINITION,
  BLACKOUT_ASSISTANT_PROMPT_VERSION,
  buildBlackoutAssistantSystemPrompt,
} from "../src/consts/blackoutAssistantPrompt";
import type { Artist, LlmRequestLog, Message, Passage } from "../src/types";
import { createArtistCommitRequest } from "../src/utils/artistPayload";
import { createEmptyPoem } from "../src/utils/artistRounds";
import { normalizePoemDataForStorage } from "../server/api/utils/artistPayload";
import { JSON_BODY_LIMIT } from "../server/api/config";

const passage: Passage = {
  id: "passage-2",
  title: "Test passage",
  author: "Test author",
  text: "one two three four five",
};

const emptySurvey = {
  id: "survey",
  title: "Survey",
  sections: [],
};

const message = (
  id: string,
  stage: "SPARK" | "WRITE",
  content: string,
): Message => ({
  id,
  stage,
  content,
  role: "user",
  kind: "USER_MESSAGE",
  inputSource: "TYPED",
  timestamp: new Date("2026-09-02T18:00:00Z"),
});

const requestLog = (index: number): LlmRequestLog => ({
  id: `request-${index}`,
  stage: "WRITE",
  userMessageId: `message-${index}`,
  userMessageContent: `request ${index}`,
  requestedAt: new Date("2026-09-02T18:00:00Z"),
  completedAt: new Date("2026-09-02T18:00:01Z"),
  status: "COMPLETED",
  inputSource: "TYPED",
  selectedWordIndexes: [0, 2],
  promptVersion: BLACKOUT_ASSISTANT_PROMPT_VERSION,
});

describe("artist payload regression", () => {
  it("accepts a request larger than the old 100 KB parser ceiling", async () => {
    const app = express();
    app.use(express.json({ limit: JSON_BODY_LIMIT }));
    app.post("/payload", (_request, response) =>
      response.status(204).end(),
    );
    const server = app.listen(0);

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Test server did not expose a TCP port");
      }
      const response = await fetch(`http://127.0.0.1:${address.port}/payload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "x".repeat(150 * 1024) }),
      });

      expect(response.status).toBe(204);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it("stores the prompt definition once while retaining per-request context", () => {
    const poem = createEmptyPoem(passage);
    poem.llmUsage.requests = Array.from({ length: 12 }, (_, index) =>
      requestLog(index),
    );

    expect(poem.llmUsage.promptDefinition).toEqual(
      BLACKOUT_ASSISTANT_PROMPT_DEFINITION,
    );
    expect(poem.llmUsage.requests).toHaveLength(12);
    expect(
      poem.llmUsage.requests.every(
        (request) =>
          request.systemPrompt === undefined &&
          request.selectedWordIndexes?.join(",") === "0,2",
      ),
    ).toBe(true);
  });

  it("builds the same complete prompt from normalized reproducibility data", () => {
    const prompt = buildBlackoutAssistantSystemPrompt({
      stage: "WRITE",
      passage: passage.text,
      selectedWords: "one three",
    });

    expect(prompt).toContain("experienced blackout-poetry workshop facilitator");
    expect(prompt).toContain("The user is now composing");
    expect(prompt).toContain(`PASSAGE:\n${passage.text}`);
    expect(prompt).toContain(
      "CURRENT SELECTED WORDS (in passage order): one three",
    );
  });

  it("sends each large poem structure once and stays below the old limit", () => {
    const poem = createEmptyPoem(passage);
    const sparkMessage = message("spark", "SPARK", "spark notes");
    const writeMessage = message("write", "WRITE", "write notes");
    poem.text = [0, 2];
    poem.poemSnapshot = [
      {
        action: "ADD",
        index: 0,
        source: "DIRECT",
        timestamp: new Date("2026-09-02T18:00:00Z"),
      },
    ];
    poem.sparkConversation = [sparkMessage];
    poem.writeConversation = [sparkMessage, writeMessage];
    poem.llmUsage.requests = Array.from({ length: 12 }, (_, index) =>
      requestLog(index),
    );

    const artistData: Artist = {
      condition: "LLM",
      poem,
      poemNumber: 2,
      totalPoems: 3,
      timeStamps: [new Date("2026-09-02T18:00:00Z")],
      assignment: {
        strategy: "LLM_ONLY",
        passageId: "passage-1",
        passageIds: ["passage-1", "passage-2", "passage-3"],
        tutorialPassageId: "tutorial",
        taskPassageId: "passage-1",
        passagePoolVersion: "test",
        condition: "LLM",
        assignedAt: new Date("2026-09-02T17:00:00Z"),
      },
      surveyResponse: {
        id: "survey",
        preSurvey: emptySurvey,
        preAnswers: {},
        postSurvey: emptySurvey,
        postAnswers: {},
      },
    };

    const payload = createArtistCommitRequest({
      artistData,
      surveyData: {
        preSurvey: emptySurvey,
        preSurveyAnswers: {},
        postSurvey: emptySurvey,
        postSurveyAnswers: {},
        poemNumber: 2,
        totalPoems: 3,
      },
      sessionId: "session",
      prolific: null,
      poemNumber: 2,
      totalPoems: 3,
      isFinalPoem: false,
    });

    expect(payload.artistData).not.toHaveProperty("poem");
    expect(payload.artistData).not.toHaveProperty("surveyResponse");
    expect(payload.poemData).not.toHaveProperty("text");
    expect(payload.poemData).not.toHaveProperty("snapshot");
    expect(payload.poemData).not.toHaveProperty("sparkConversation");
    expect(payload.poemData).not.toHaveProperty("writeConversation");
    expect(payload.poemData.conversation).toHaveLength(2);
    expect(payload.poemData.taskPassageId).toBe("passage-2");
    expect(Buffer.byteLength(JSON.stringify(payload), "utf8")).toBeLessThan(
      100 * 1024,
    );
  });

  it("expands compact data to the existing Firestore schema without loss", () => {
    const sparkMessage = message("spark", "SPARK", "spark notes");
    const writeMessage = message("write", "WRITE", "write notes");
    const editingEvent = {
      action: "ADD",
      index: 2,
      source: "DIRECT",
      timestamp: "2026-09-02T18:00:00Z",
    };

    const stored = normalizePoemDataForStorage({
      passageId: passage.id,
      selectedWordIndexes: [0, 2],
      editHistory: [editingEvent],
      conversation: [sparkMessage, writeMessage],
    });

    expect(stored.text).toEqual([0, 2]);
    expect(stored.selectedWordIndexes).toEqual([0, 2]);
    expect(stored.snapshot).toEqual([editingEvent]);
    expect(stored.editHistory).toEqual([editingEvent]);
    expect(stored.sparkConversation).toEqual([sparkMessage]);
    expect(stored.writeConversation).toEqual([sparkMessage, writeMessage]);
    expect(stored).not.toHaveProperty("conversation");
  });

  it("continues accepting old clients that send compatibility aliases", () => {
    const sparkMessage = message("spark", "SPARK", "spark notes");
    const writeMessage = message("write", "WRITE", "write notes");

    const stored = normalizePoemDataForStorage({
      text: [1],
      snapshot: [{ action: "ADD", index: 1 }],
      sparkConversation: [sparkMessage],
      writeConversation: [sparkMessage, writeMessage],
    });

    expect(stored.selectedWordIndexes).toEqual([1]);
    expect(stored.editHistory).toEqual([{ action: "ADD", index: 1 }]);
    expect(stored.sparkConversation).toEqual([sparkMessage]);
    expect(stored.writeConversation).toEqual([sparkMessage, writeMessage]);
  });
});
