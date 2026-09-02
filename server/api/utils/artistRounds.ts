export const TOTAL_ARTIST_POEMS = 3;

export const normalizePassageIds = (
  passageId: unknown,
  passageIds: unknown,
  count = TOTAL_ARTIST_POEMS,
) => {
  const firstPassageId = String(passageId ?? "").trim();
  const requestedIds = Array.isArray(passageIds)
    ? passageIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const orderedIds = [
    ...new Set([
      ...(firstPassageId ? [firstPassageId] : []),
      ...requestedIds.filter((id) => id !== firstPassageId),
    ]),
  ];

  if (orderedIds.length === 0) return [];
  return Array.from(
    { length: count },
    (_, index) => orderedIds[index % orderedIds.length],
  );
};

export interface ArtistRoundMetadata {
  poemNumber: number;
  totalPoems: number;
  isFinalPoem: boolean;
}

export const resolveArtistRoundMetadata = (
  requestedPoemNumber: unknown,
  requestedTotalPoems: unknown,
  requestedIsFinalPoem: unknown,
  artistData: Record<string, unknown>,
): ArtistRoundMetadata | null => {
  const poemNumber = Number(requestedPoemNumber ?? artistData.poemNumber ?? 1);
  const totalPoems = Number(requestedTotalPoems ?? artistData.totalPoems ?? 1);
  if (
    !Number.isInteger(poemNumber) ||
    !Number.isInteger(totalPoems) ||
    poemNumber < 1 ||
    totalPoems < 1 ||
    poemNumber > totalPoems
  ) {
    return null;
  }

  const isFinalPoem =
    requestedIsFinalPoem === undefined
      ? poemNumber === totalPoems
      : requestedIsFinalPoem === true;
  if (isFinalPoem !== (poemNumber === totalPoems)) return null;

  return { poemNumber, totalPoems, isFinalPoem };
};

export const createArtistRoundIdentifiers = (
  sessionId: string,
  poemNumber: number,
) => ({
  roundId: `${sessionId}:poem:${poemNumber}`,
  roundDocumentId: `${encodeURIComponent(sessionId)}__poem_${poemNumber}`,
});
