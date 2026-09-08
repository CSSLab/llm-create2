// Hand-written "intended meaning" decoy statements, one set of 7 per source
// passage in `Passages` (src/consts/passages.tsx). None of these reference
// specific words/names/phrases from their passage - they're meant to feel
// plausible as a stated intent behind a blackout poem drawn from that
// passage without being checkable against its literal vocabulary.
//
// Style is deliberately varied on two axes:
//  - within each passage's 7, no two statements share a sentence format, so
//    the real statement can't be picked out by tone/structure alone.
//  - across passages, the *set* (and order) of formats used is different
//    each time - a participant who sees several trials over the course of
//    the study shouldn't be able to learn "the real one is always phrased
//    like X" or "decoys are always phrased like Y".
//
// Used as the statement pool for the audience preview/test assignment
// (see `audienceTestAssignment.ts`): the first 4 entries stand in as the
// "real" statement for each of the 4 test poems, the last 3 are shared
// decoys rotated across all four statement-match trials.
export const PASSAGE_DISTRACTOR_STATEMENTS: Record<string, string[]> = {
  // The Secret Garden - awakening senses, secrecy, hushed anticipation
  "3": [
    "For the most part, this poem is about senses waking up all at once after being shut off for a long time.",
    "I wanted to express the hush that comes right before something wonderful happens",
    "This is about a fragile body finally catching up to a world it's only just starting to notice",
    "A private thrill, kept quiet on purpose",
    "Capture the difference between looking and truly listening",
    "I wanted the poem to feel like a held breath",
    "I kept coming back to the idea of tiptoeing somewhere you're not sure you're allowed to be.",
  ],
  // Ballet Shoes - domestic joy, unexpected contentment
  "4": [
    "I was trying to explore how ordinary routines can turn into the best part of a day.",
    "You can feel the comfort of shared chores and simple mornings underneath all of it",
    "The poem explores contentment that sneaks up on you when you weren't expecting a good time at all",
    "Repeating small rituals as a sort of happiness",
    "There's a kind of ease I wanted the reader to sit with, the sense that a place can start to feel like home almost by accident.",
    "What does it mean when the people around you turn into easy companions without either of you noticing?",
    "A lazy, satisfied morning",
  ],
  // Anne of Green Gables - dreaming beyond the mundane, youthful possibility
  "2": [
    "I kept thinking about the pull of imagining a future bigger than the room you're sitting in while choosing these words",
    "This is about drifting into hope while everyone around you is talking about small things.",
    "I wanted to express the gap between practical chatter and a private sweeping sense of possibility",
    "my idea was to capture daydreams that feel like certainty",
    "Youth is the permission to imagine",
    "this poem is quiet ambition dressed up as idle conversation.",
    "I wanted the poem to feel like watching a sunset and mistaking it for a promise.",
  ],
  // The God of Small Things - homecoming, decay and renewal, weather's power
  "1": [
    "The poem explores what it feels like to return to a place that has changed without you.",
    "The idea that weather can rewrite a landscape almost overnight",
    "You can feel a house aging right along with the people who left it underneath all of it.",
    "Old walls that still hold on to the past",
    "I wanted to express how memory clings to a place the way dampness clings to stone.",
    "What does an uneasy homecoming feel like once you're standing back inside it?",
    "There's a kind of familiar-but-wrong feeling I wanted the reader to sit with",
  ],
  // The House of Spirits - contained passion, unmet potential
  "5": [
    "This is about a love too large for the small life it was given.",
    "I was trying to convey how someone can be capable of enormous feeling and still end up isolated.",
    "My goal was to capture the mismatch between what a person is capable of and the life circumstance hands them",
    "Too much feeling in too little room.",
    "I kept thinking about the difference between grand emotion and everyday warmth",
    "I wanted the poem to feel like a fire kept banked instead of let out.",
    "this poem is quiet devotion with nowhere left to go.",
  ],
  // "If It's Possible, It Happened" - chance, parallel fates, mortality
  "nyt-1": [
    "I wanted to express how close we all are, constantly, to an ending we never see.",
    "What if every possible outcome actually happened, and we only remember the one we survived?",
    "Luck, but treated more like a math problem instead of a personal story",
    "I kept coming back to the idea of every version of the story happening at once.",
    "There's a kind of vertigo I wanted the reader to sit with, the feeling of many futures collapsing into one.",
    "the poem explores how much of survival really just comes down to timing.",
    "You can feel a near-miss replaying itself underneath all of it",
  ],
  // "At Coachella, It's A Guy Thing" - performance of image, indulgence and its aftermath
  "nyt-2": [
    "this poem is about how much effort goes into looking like you're not trying.",
    "I kept thinking about the performance underneath a crowd that thinks it's just having fun while choosing these words.",
    "This is about the gap between how a moment looks and how it actually feels the morning after",
    "Curated carelessness",
    "I was trying to convey how identity gets assembled out of borrowed pieces",
    "i was envisioning a sort of restless kind of self-consciousness",
    "I wanted the poem to feel like a party photographed a beat too late",
  ],
  // "They Hook You When You're Young" - childhood shaping adult identity
  "nyt-3": [
    "How does something small from childhood end up quietly deciding who we become?",
    "The poem explores loyalty as something we inherit more than choose",
    "You can feel an old pattern, set young and followed for decades, underneath everything",
    "a habit formed early, never questioned since.",
    "I wanted to express how data can explain something as personal as devotion",
    "I kept coming back to the idea of inherited attachment as I worked on this",
    "There's a kind of grown-up habit I wanted the reader to sit with. One that traces straight back to a much younger version of yourself.",
  ],
  // "Yet Another Pretty Face" - fame, scrutiny, reinvention, ephemerality
  "nyt-4": [
    "I was trying to convey how being looked at constantly can start to feel like a kind of erasure",
    "this is about the pressure of being ranked and measured against everyone else in the room.",
    "My goal was to capture what it costs to keep reinventing yourself for an audience that's always watching",
    "Famous for a moment, but judged forever.",
    "I wanted to express the difference between being seen and being truly known",
    "I wanted the poem to feel like flipping through a magazine and forgetting the face on the cover by the next page",
    "restless ambition dressed up as confidence",
  ],
};
