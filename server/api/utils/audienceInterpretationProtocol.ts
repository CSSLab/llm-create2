// Shared presentation contract. Creator AI use is a separate variable.
export type InterpretationCondition = "AI" | "NO_AI";
export const INTERPRETATION_DISPLAY = {
  version: "delayed-character-reveal-v1",
  delayMs: 6000,
  characterIntervalMs: 20,
  heading: "Here is one possible interpretation from AI.",
} as const;

export const assignInterpretationCondition = (random = Math.random): InterpretationCondition =>
  random() < 0.5 ? "AI" : "NO_AI";

export interface InterpretationExposure {
  poemId: string;
  condition: InterpretationCondition;
  interpretationId: string | null;
  displayVersion: string;
  scheduledDelayMs: number;
  characterIntervalMs: number;
  screenOpenedAt: string;
  revealStartedAt: string | null;
  revealCompletedAt: string | null;
  recordedAt: string;
  submittedAt: string | null;
  elapsedMs: number;
  charactersDisplayed: number;
  totalCharacters: number;
  // Foreground time while at least part of the interpretation panel intersects
  // the viewport. These are display measurements, not claims about reading.
  panelVisibleMs: number;
  documentHiddenMs: number;
  maxCharactersVisible: number;
}

export const isInterpretationText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 &&
  value === value.trim() && !/[\r\n]/.test(value);
