import type { AudiencePoem, Passage } from "../types";

const TUTORIAL_VISIBLE_WORDS: Record<string, string[]> = {
  "1": [
    "expectation",
    "monsoon",
    "breaks",
    "glittering",
    "sunshine",
    "countryside",
    "green",
  ],
  "2": ["trying", "winning", "best", "trying", "failing"],
  "3": ["wind", "strange", "wild", "clear", "scented", "sweetness"],
  "4": ["not", "expecting", "holiday", "one", "second", "perfect"],
  "5": [
    "solitude",
    "emotions",
    "magnificent",
    "passions",
    "possessed",
    "totally",
  ],
  "nyt-1": [
    "blast",
    "horn",
    "screech",
    "tires",
    "sickening",
    "thud",
    "quick",
    "succession",
  ],
  "nyt-2": ["people", "getting", "more", "brave", "embracing", "it"],
  "nyt-3": ["childhood", "shape", "adult", "preferences"],
  "nyt-4": ["model", "super", "name", "recognition", "Kate", "Upton", "qualifies"],
};

const normalizeWord = (word: string) =>
  word.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export const createAudienceTutorialPoem = (
  passage: Passage,
): AudiencePoem => {
  const targetWords = TUTORIAL_VISIBLE_WORDS[passage.id];
  if (!targetWords) {
    throw new Error(`No audience tutorial example exists for ${passage.id}`);
  }

  const passageWords = passage.text.split(" ");
  let searchFrom = 0;
  const selectedWordIndexes = targetWords.map((targetWord) => {
    const normalizedTarget = normalizeWord(targetWord);
    const relativeIndex = passageWords
      .slice(searchFrom)
      .findIndex((word) => normalizeWord(word) === normalizedTarget);

    if (relativeIndex < 0) {
      throw new Error(
        `Tutorial word "${targetWord}" was not found in passage ${passage.id}`,
      );
    }

    const absoluteIndex = searchFrom + relativeIndex;
    searchFrom = absoluteIndex + 1;
    return absoluteIndex;
  });

  const excerptStart = Math.max(0, selectedWordIndexes[0] - 4);
  const excerptEnd = Math.min(
    passageWords.length,
    selectedWordIndexes[selectedWordIndexes.length - 1] + 5,
  );

  return {
    id: `tutorial-${passage.id}`,
    passageId: passage.id,
    passage: {
      ...passage,
      text: passageWords.slice(excerptStart, excerptEnd).join(" "),
    },
    selectedWordIndexes: selectedWordIndexes.map(
      (wordIndex) => wordIndex - excerptStart,
    ),
  };
};

export const getAudiencePoemText = (poem: AudiencePoem) => {
  const passageWords = poem.passage.text.split(" ");
  return poem.selectedWordIndexes
    .map((wordIndex) => passageWords[wordIndex])
    .filter(Boolean)
    .join(" ");
};
