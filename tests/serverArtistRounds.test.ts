import { describe, expect, it } from "vitest";
import {
  createArtistRoundIdentifiers,
  normalizePassageIds,
  resolveArtistRoundMetadata,
} from "../server/api/utils/artistRounds";

describe("artist round persistence metadata", () => {
  it("normalizes a short passage pool to three ordered assignments", () => {
    expect(normalizePassageIds("a", ["a", "b", "a"])).toEqual([
      "a",
      "b",
      "a",
    ]);
    expect(normalizePassageIds("a", ["b", "a", "b"])).toEqual([
      "a",
      "b",
      "a",
    ]);
    expect(normalizePassageIds("a", undefined)).toEqual(["a", "a", "a"]);
  });

  it("accepts each valid position and identifies only poem 3 as final", () => {
    expect(resolveArtistRoundMetadata(1, 3, false, {})).toEqual({
      poemNumber: 1,
      totalPoems: 3,
      isFinalPoem: false,
    });
    expect(resolveArtistRoundMetadata(3, 3, true, {})).toEqual({
      poemNumber: 3,
      totalPoems: 3,
      isFinalPoem: true,
    });
  });

  it("rejects out-of-range or inconsistent final-round metadata", () => {
    expect(resolveArtistRoundMetadata(0, 3, false, {})).toBeNull();
    expect(resolveArtistRoundMetadata(4, 3, true, {})).toBeNull();
    expect(resolveArtistRoundMetadata(2, 3, true, {})).toBeNull();
    expect(resolveArtistRoundMetadata(3, 3, false, {})).toBeNull();
  });

  it("creates stable per-session, per-poem document identifiers", () => {
    expect(createArtistRoundIdentifiers("session/with/slash", 2)).toEqual({
      roundId: "session/with/slash:poem:2",
      roundDocumentId: "session%2Fwith%2Fslash__poem_2",
    });
  });
});
