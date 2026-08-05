import type { ChatAvailability, LlmUsage } from "../types";

export const getChatAvailability = (
  llmUsage: LlmUsage | undefined,
): ChatAvailability[] => {
  if (llmUsage?.chatAvailability) return llmUsage.chatAvailability;

  return (llmUsage?.chatOpenings ?? []).map((opening) => ({
    stage: opening.stage,
    availableAt: opening.timestamp,
  }));
};
