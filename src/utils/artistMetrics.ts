import type { ChatInputActivity, Message, Poem, Stage } from "../types";
import { ChatInputSource, MessageKind, Stage as StageValue } from "../types";
import { getChatAvailability } from "./llmUsage";

const toMillis = (value: Date | string | undefined) =>
  value ? new Date(value).getTime() : undefined;

const elapsedMs = (
  start: Date | string | undefined,
  end: Date | string | undefined,
) => {
  const startMs = toMillis(start);
  const endMs = toMillis(end);
  return startMs !== undefined && endMs !== undefined
    ? Math.max(0, endMs - startMs)
    : null;
};

const getUniqueConversationMessages = (poem: Poem) => {
  const messagesById = new Map<string, Message>();
  [...(poem.sparkConversation ?? []), ...(poem.writeConversation ?? [])].forEach(
    (message) => messagesById.set(message.id, message),
  );
  return [...messagesById.values()];
};

const getStageChatMetrics = (
  stage: Stage,
  chatAvailability: ReturnType<typeof getChatAvailability>,
  inputActivity: ChatInputActivity[],
  messages: Message[],
) => {
  const availability = chatAvailability.find((item) => item.stage === stage);
  const activity = inputActivity.find((item) => item.stage === stage);
  const stageMessages = messages.filter((message) => message.stage === stage);

  return {
    chatAvailable: Boolean(availability),
    chatFocusCount: activity?.focusCount ?? 0,
    chatEverTyped: Boolean(activity?.firstTypedAt),
    chatDraftStartCount: activity?.draftStartCount ?? 0,
    chatAbandonedDraftCount: activity?.abandonedDraftCount ?? 0,
    chatEndedWithUnsentDraft: activity?.hasUnsentDraft ?? false,
    timeFromChatAvailableToFirstFocusMs: elapsedMs(
      availability?.availableAt,
      activity?.firstFocusedAt,
    ),
    timeFromChatAvailableToFirstTypingMs: elapsedMs(
      availability?.availableAt,
      activity?.firstTypedAt,
    ),
    stageOpeningShown: stageMessages.some(
      (message) => message.kind === MessageKind.STAGE_OPENING,
    ),
    idleNudgeShown: stageMessages.some(
      (message) => message.kind === MessageKind.IDLE_NUDGE,
    ),
  };
};

export const getFinalPoemText = (poem: Poem) => {
  const words = poem.passage.text.split(" ");
  return [...new Set(poem.text)]
    .sort((a, b) => a - b)
    .map((index) => words[index])
    .filter((word): word is string => Boolean(word))
    .join(" ");
};
export const deriveArtistMetrics = (poem: Poem) => {
  const snapshots = poem.poemSnapshot ?? [];
  const writeStartedAt = toMillis(poem.taskTiming?.phases?.write?.startedAt);
  const firstSelection = snapshots.find((snapshot) => snapshot.action === "ADD");
  const finalEdit = snapshots.at(-1);
  const lastActionByIndex = new Map<number, "ADD" | "REMOVE">();
  let reversalCount = 0;

  snapshots.forEach((snapshot) => {
    const previousAction = lastActionByIndex.get(snapshot.index);
    if (previousAction && previousAction !== snapshot.action) reversalCount += 1;
    lastActionByIndex.set(snapshot.index, snapshot.action);
  });

  const completedRequests = (poem.llmUsage?.requests ?? []).filter(
    (request) => request.status === "COMPLETED",
  );
  const requests = poem.llmUsage?.requests ?? [];
  const hasDetailedChatLogging = Array.isArray(poem.llmUsage?.inputActivity);
  const chatAvailability = getChatAvailability(poem.llmUsage);
  const inputActivity = poem.llmUsage?.inputActivity ?? [];
  const conversationMessages = getUniqueConversationMessages(poem);
  const sparkChat = getStageChatMetrics(
    StageValue.SPARK,
    chatAvailability,
    inputActivity,
    conversationMessages,
  );
  const writeChat = getStageChatMetrics(
    StageValue.WRITE,
    chatAvailability,
    inputActivity,
    conversationMessages,
  );

  return {
    selectedWordCount: new Set(poem.text).size,
    additionCount: snapshots.filter((snapshot) => snapshot.action === "ADD")
      .length,
    removalCount: snapshots.filter((snapshot) => snapshot.action === "REMOVE")
      .length,
    reversalCount,
    undoCount: snapshots.filter((snapshot) => snapshot.source === "UNDO")
      .length,
    redoCount: snapshots.filter((snapshot) => snapshot.source === "REDO")
      .length,
    totalEditingActivity: snapshots.length,
    timeToFirstSelectionMs:
      writeStartedAt && firstSelection
        ? Math.max(0, toMillis(firstSelection.timestamp)! - writeStartedAt)
        : null,
    timeToFinalEditMs:
      writeStartedAt && finalEdit
        ? Math.max(0, toMillis(finalEdit.timestamp)! - writeStartedAt)
        : null,
    totalTaskTimeMs: poem.taskTiming?.totalDurationMs ?? null,
    sparkTimeMs: poem.taskTiming?.phases?.spark?.durationMs ?? null,
    writeTimeMs: poem.taskTiming?.phases?.write?.durationMs ?? null,
    llmUptake: completedRequests.length > 0,
    llmTurnCount: completedRequests.length,
    llmAttemptCount: requests.length,
    llmTypedAttemptCount: hasDetailedChatLogging
      ? requests.filter(
          (request) => request.inputSource === ChatInputSource.TYPED,
        ).length
      : null,
    llmSuggestionAttemptCount: hasDetailedChatLogging
      ? requests.filter(
          (request) => request.inputSource === ChatInputSource.SUGGESTION,
        ).length
      : null,
    chatAvailableStageCount: new Set(
      chatAvailability.map((availability) => availability.stage),
    ).size,
    chatFocusCount: hasDetailedChatLogging
      ? sparkChat.chatFocusCount + writeChat.chatFocusCount
      : null,
    chatDraftStartCount: hasDetailedChatLogging
      ? sparkChat.chatDraftStartCount + writeChat.chatDraftStartCount
      : null,
    chatAbandonedDraftCount: hasDetailedChatLogging
      ? sparkChat.chatAbandonedDraftCount +
        writeChat.chatAbandonedDraftCount
      : null,
    sparkChatAvailable: sparkChat.chatAvailable,
    sparkChatFocusCount: hasDetailedChatLogging
      ? sparkChat.chatFocusCount
      : null,
    sparkChatEverTyped: hasDetailedChatLogging
      ? sparkChat.chatEverTyped
      : null,
    sparkChatDraftStartCount: hasDetailedChatLogging
      ? sparkChat.chatDraftStartCount
      : null,
    sparkChatAbandonedDraftCount: hasDetailedChatLogging
      ? sparkChat.chatAbandonedDraftCount
      : null,
    sparkChatEndedWithUnsentDraft: hasDetailedChatLogging
      ? sparkChat.chatEndedWithUnsentDraft
      : null,
    sparkTimeFromChatAvailableToFirstFocusMs: hasDetailedChatLogging
      ? sparkChat.timeFromChatAvailableToFirstFocusMs
      : null,
    sparkTimeFromChatAvailableToFirstTypingMs: hasDetailedChatLogging
      ? sparkChat.timeFromChatAvailableToFirstTypingMs
      : null,
    sparkStageOpeningShown: hasDetailedChatLogging
      ? sparkChat.stageOpeningShown
      : null,
    sparkIdleNudgeShown: hasDetailedChatLogging
      ? sparkChat.idleNudgeShown
      : null,
    writeChatAvailable: writeChat.chatAvailable,
    writeChatFocusCount: hasDetailedChatLogging
      ? writeChat.chatFocusCount
      : null,
    writeChatEverTyped: hasDetailedChatLogging
      ? writeChat.chatEverTyped
      : null,
    writeChatDraftStartCount: hasDetailedChatLogging
      ? writeChat.chatDraftStartCount
      : null,
    writeChatAbandonedDraftCount: hasDetailedChatLogging
      ? writeChat.chatAbandonedDraftCount
      : null,
    writeChatEndedWithUnsentDraft: hasDetailedChatLogging
      ? writeChat.chatEndedWithUnsentDraft
      : null,
    writeTimeFromChatAvailableToFirstFocusMs: hasDetailedChatLogging
      ? writeChat.timeFromChatAvailableToFirstFocusMs
      : null,
    writeTimeFromChatAvailableToFirstTypingMs: hasDetailedChatLogging
      ? writeChat.timeFromChatAvailableToFirstTypingMs
      : null,
    writeStageOpeningShown: hasDetailedChatLogging
      ? writeChat.stageOpeningShown
      : null,
    writeIdleNudgeShown: hasDetailedChatLogging
      ? writeChat.idleNudgeShown
      : null,
  };
};
