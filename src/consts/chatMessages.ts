import { nanoid } from "nanoid";
import type { Message, MessageKind, Stage } from "../types";
import { Role } from "../types";

export const STAGE_OPENING_MESSAGES: Record<Stage, string> = {
  SPARK:
    "Hi! I'm an AI assistant here to help with your blackout poem—brainstorming ideas, exploring the passage, or whatever is useful. Ask me anything, the way you would use any AI chatbot.",
  WRITE:
    "You're in the writing stage now. As you select words in the passage, I can see them, so feel free to ask about specific choices or how to shape what you have.",
};

export const IDLE_NUDGE_MESSAGES: Record<Stage, string> = {
  SPARK:
    "No rush—if you'd like a starting point, I can suggest a few possible directions, or you can tell me anything in the passage that catches your eye.",
  WRITE:
    "If you're stuck, tell me the feeling you're going for, or ask me to point out a few usable words.",
};

export const createAssistantMessage = (
  content: string,
  stage: Stage,
  kind: MessageKind,
): Message => ({
  id: nanoid(),
  role: Role.LLM,
  content,
  timestamp: new Date(),
  stage,
  kind,
});
