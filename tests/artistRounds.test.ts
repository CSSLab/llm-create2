import { describe, expect, it } from "vitest";
import { ArtistPostSurveyQuestions } from "../src/consts/surveyQuestions";
import type { Passage } from "../src/types";
import {
  createEmptyPoem,
  createPassageSequence,
  getArtistPostSurveyForPoem,
  getPassageForPoem,
  TOTAL_ARTIST_POEMS,
} from "../src/utils/artistRounds";

const passages: Passage[] = [
  { id: "a", text: "alpha passage", title: "A", author: "Author A" },
  { id: "b", text: "beta passage", title: "B", author: "Author B" },
];

describe("artist poem rounds", () => {
  it("creates three assignments and exhausts the pool before repeating", () => {
    const sequence = createPassageSequence(
      passages,
      TOTAL_ARTIST_POEMS,
      () => 0.999,
    );

    expect(sequence).toHaveLength(3);
    expect(new Set(sequence.slice(0, passages.length)).size).toBe(
      passages.length,
    );
    expect(sequence[2]).toBe(sequence[0]);
  });

  it("resolves each assigned passage by one-based poem number", () => {
    expect(getPassageForPoem(passages, ["b", "a", "b"], 2)).toBe(
      passages[0],
    );
    expect(() => getPassageForPoem(passages, ["a"], 2)).toThrow(
      "Passage assignment for poem 2 is invalid",
    );
  });

  it("creates a clean poem state for every round", () => {
    const first = createEmptyPoem(passages[0]);
    const second = createEmptyPoem(passages[0]);

    first.text.push(1);
    expect(second.text).toEqual([]);
    expect(second.poemSnapshot).toEqual([]);
    expect(second.sparkConversation).toEqual([]);
    expect(second.writeConversation).toEqual([]);
    expect(second.llmUsage.promptDefinition?.promptVersion).toBe(
      "blackout-assistant-2026-08-21-v3",
    );
  });

  it("repeats poem-specific measures and reserves general questions for poem 3", () => {
    const firstSurvey = getArtistPostSurveyForPoem(
      ArtistPostSurveyQuestions,
      1,
      3,
      "LLM",
    );
    const secondSurvey = getArtistPostSurveyForPoem(
      ArtistPostSurveyQuestions,
      2,
      3,
      "LLM",
    );
    const finalSurvey = getArtistPostSurveyForPoem(
      ArtistPostSurveyQuestions,
      3,
      3,
      "LLM",
    );

    expect(secondSurvey.sections.map((section) => section.id)).toEqual(
      firstSurvey.sections.map((section) => section.id),
    );
    expect(firstSurvey.sections.map((section) => section.id)).not.toContain(
      "outside-tools",
    );
    expect(firstSurvey.sections.map((section) => section.id)).not.toContain(
      "exploratory-operational",
    );
    expect(finalSurvey.sections.map((section) => section.id)).toContain(
      "outside-tools",
    );
    expect(finalSurvey.sections.map((section) => section.id)).toContain(
      "exploratory-operational",
    );
  });

  it("keeps condition-specific measures filtered in every round", () => {
    const noAiSurvey = getArtistPostSurveyForPoem(
      ArtistPostSurveyQuestions,
      3,
      3,
      "NO_AI",
    );

    expect(noAiSurvey.sections.map((section) => section.id)).not.toContain(
      "llm-attribution",
    );
  });
});
