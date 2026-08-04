import type { Poem } from "../types";

const toMillis = (value: Date | string | undefined) =>
  value ? new Date(value).getTime() : undefined;

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
    llmAttemptCount: poem.llmUsage?.requests?.length ?? 0,
    chatOpeningCount: poem.llmUsage?.chatOpenings?.length ?? 0,
  };
};
