import type { Message, PoemSnapshot } from "../types";
import type {
  ExhibitionParticipant,
  TimelineEvent,
  TimelineEventKind,
} from "./types";

const toMs = (value: unknown): number | null => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object") {
    const candidate = value as { seconds?: number; _seconds?: number };
    const seconds = candidate.seconds ?? candidate._seconds;
    if (typeof seconds === "number") return seconds * 1000;
  }
  return null;
};

export const formatDuration = (durationMs: number | null | undefined) => {
  if (durationMs === null || durationMs === undefined || durationMs < 0) return "—";
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const getPoemTitle = (participant: ExhibitionParticipant) => {
  const selected = participant.poem.finalPoem.trim().split(/\s+/).filter(Boolean);
  if (selected.length === 0) return "Untitled blackout";
  return selected.slice(0, 7).join(" ").replace(/[.,;:!?]+$/, "");
};

const snapshotKind = (snapshot: PoemSnapshot): TimelineEventKind => {
  if (snapshot.source === "UNDO") return "undo";
  if (snapshot.source === "REDO") return "redo";
  return snapshot.action === "ADD" ? "add" : "remove";
};

const messageLabel = (message: Message) =>
  message.role === "user" ? "Participant asked the assistant" : "Assistant replied";

interface PendingEvent {
  id: string;
  timestampMs: number;
  kind: TimelineEventKind;
  stage: "SPARK" | "WRITE";
  label: string;
  wordIndex?: number;
  message?: Message;
}

export const buildTimeline = (
  participant: ExhibitionParticipant,
): TimelineEvent[] => {
  const { poem } = participant;
  const writeStart = toMs(poem.taskTiming?.phases?.write?.startedAt);
  const sparkStart = toMs(poem.taskTiming?.phases?.spark?.startedAt);
  const taskStart = toMs(poem.taskTiming?.startedAt);
  const pending: PendingEvent[] = [];

  if (sparkStart) {
    pending.push({
      id: "phase-spark",
      timestampMs: sparkStart,
      kind: "phase",
      stage: "SPARK",
      label: "Brainstorm began",
    });
  }
  if (writeStart) {
    pending.push({
      id: "phase-write",
      timestampMs: writeStart,
      kind: "phase",
      stage: "WRITE",
      label: "Writing began",
    });
  }

  poem.editHistory.forEach((snapshot, index) => {
    const timestampMs = toMs(snapshot.timestamp) ?? (writeStart ?? taskStart ?? 0) + index;
    const word = poem.passage.text.split(" ")[snapshot.index] ?? `word ${snapshot.index + 1}`;
    const kind = snapshotKind(snapshot);
    pending.push({
      id: `edit-${index}`,
      timestampMs,
      kind,
      stage: "WRITE",
      label:
        kind === "undo"
          ? `Undid change to “${word}”`
          : kind === "redo"
            ? `Redid change to “${word}”`
            : `${kind === "add" ? "Added" : "Removed"} “${word}”`,
      wordIndex: snapshot.index,
    });
  });

  const addMessages = (
    messages: Message[],
    stage: "SPARK" | "WRITE",
    prefix: string,
  ) => {
    const seenMessages = new Set(
      pending
        .filter((event) => event.message)
        .map((event) =>
          event.message?.id ||
          `${event.message?.role}|${toMs(event.message?.timestamp)}|${event.message?.content}`,
        ),
    );
    messages.forEach((message, index) => {
      const messageStage =
        "stage" in message && message.stage === "SPARK"
          ? "SPARK"
          : "stage" in message && message.stage === "WRITE"
            ? "WRITE"
            : stage;
      const messageKey =
        message.id || `${message.role}|${toMs(message.timestamp)}|${message.content}`;
      if (seenMessages.has(messageKey)) return;
      seenMessages.add(messageKey);
      const fallbackStart = messageStage === "SPARK" ? sparkStart : writeStart;
      pending.push({
        id: `${prefix}-${message.id || index}`,
        timestampMs: toMs(message.timestamp) ?? (fallbackStart ?? taskStart ?? 0) + index,
        kind: message.role === "user" ? "user-message" : "assistant-message",
        stage: messageStage,
        label: messageLabel(message),
        message,
      });
    });
  };

  addMessages(poem.sparkConversation ?? [], "SPARK", "spark-message");
  addMessages(poem.writeConversation ?? [], "WRITE", "write-message");

  (poem.llmUsage?.chatOpenings ?? []).forEach((opening, index) => {
    pending.push({
      id: `chat-open-${index}`,
      timestampMs:
        toMs(opening.timestamp) ??
        (opening.stage === "SPARK" ? sparkStart : writeStart) ??
        taskStart ??
        index,
      kind: "chat-open",
      stage: opening.stage === "SPARK" ? "SPARK" : "WRITE",
      label: `Opened the assistant during ${opening.stage === "SPARK" ? "brainstorming" : "writing"}`,
    });
  });

  (poem.llmUsage?.chatAvailability ?? []).forEach((availability, index) => {
    pending.push({
      id: `chat-available-${index}`,
      timestampMs:
        toMs(availability.availableAt) ??
        (availability.stage === "SPARK" ? sparkStart : writeStart) ??
        taskStart ??
        index,
      kind: "chat-open",
      stage: availability.stage === "SPARK" ? "SPARK" : "WRITE",
      label: `Assistant became available during ${availability.stage === "SPARK" ? "brainstorming" : "writing"}`,
    });
  });

  pending.sort((a, b) => a.timestampMs - b.timestampMs);
  const origin = taskStart ?? pending[0]?.timestampMs ?? 0;

  return pending.map((event) => ({
    ...event,
    atMs: Math.max(0, event.timestampMs - origin),
    timestamp: new Date(event.timestampMs).toISOString(),
  }));
};

export const replaySelections = (
  participant: ExhibitionParticipant,
  events: TimelineEvent[],
  eventIndex: number,
) => {
  const selected = new Set<number>();
  events.slice(0, eventIndex + 1).forEach((event) => {
    if (event.wordIndex === undefined) return;
    if (event.kind === "add" || event.kind === "redo") {
      selected.add(event.wordIndex);
    } else if (event.kind === "remove" || event.kind === "undo") {
      selected.delete(event.wordIndex);
    }
  });
  if (events.length === 0) return participant.poem.text;
  return [...selected];
};

export const average = (values: unknown[]) => {
  const numeric = values.filter((value): value is number => typeof value === "number");
  if (numeric.length === 0) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
};
