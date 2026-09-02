type JsonRecord = Record<string, unknown>;

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {};

const uniqueMessages = (messages: unknown[]) => {
  const seenIds = new Set<string>();
  return messages.filter((message) => {
    const candidate = asRecord(message);
    const id = typeof candidate.id === "string" ? candidate.id : null;
    if (!id) return true;
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
};

/**
 * Accepts both the compact v3 wire payload and older duplicated payloads, then
 * restores the established Firestore field names used by existing analyses.
 */
export const normalizePoemDataForStorage = (poemData: JsonRecord) => {
  const {
    conversation: compactConversation,
    poemSnapshot,
    text,
    selectedWordIndexes,
    snapshot,
    editHistory,
    sparkConversation: legacySparkConversation,
    writeConversation: legacyWriteConversation,
    ...rest
  } = poemData;

  const selectedWords = Array.isArray(selectedWordIndexes)
    ? selectedWordIndexes
    : asArray(text);
  const editingEvents = Array.isArray(editHistory)
    ? editHistory
    : Array.isArray(snapshot)
      ? snapshot
      : asArray(poemSnapshot);

  const conversation = uniqueMessages(
    Array.isArray(compactConversation)
      ? compactConversation
      : [
          ...asArray(legacySparkConversation),
          ...asArray(legacyWriteConversation),
        ],
  );
  const sparkConversation = Array.isArray(legacySparkConversation)
    ? legacySparkConversation
    : conversation.filter((message) => asRecord(message).stage === "SPARK");
  const writeConversation = Array.isArray(legacyWriteConversation)
    ? legacyWriteConversation
    : conversation;

  return {
    ...rest,
    text: selectedWords,
    selectedWordIndexes: selectedWords,
    snapshot: editingEvents,
    editHistory: editingEvents,
    sparkConversation,
    writeConversation,
  };
};
