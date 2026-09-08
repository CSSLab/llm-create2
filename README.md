# LLM Create Part 2
## Lost in Translation: Exploring the Impact of LLMs on the Human Creative Process

<img width="2438" height="619" alt="Artist and Audience" src="https://github.com/user-attachments/assets/3d50953e-5e37-4efc-9183-20527226399b" />

There is an inherently social aspect to creativity. It is the driving force that builds culture and society, and whether through direct or indirect, all creative processes involve some interaction with others [1,2]. This makes the relationship between the artist and the audience one of the most fundamental aspects of the creative process.  Now, with the progressive growth and integration of generative AI into daily activities, including the creative process, what does that mean for the future of human creativity?

In this first part of the project, we explore the two questions: “How does the use of Large Language Models during the creative process impact an individual?” and “How does the use of Large Language Models at different points in the creative process impact the creative output?”

Our experimental design involves two phases: one for artists and another for the audience. In the artist phase, participants are tasked with writing a blackout poem. Each participant is assigned to one of three conditions (control, spark, writing), which determines when and how they can use AI to complete their poem. These poems are then evaluated by participants in the audience experiment.

We plan to continue this research in a second part through a longitudinal field study.

1. Kwan, L. Y. -Y., Leung, A. K. -y., & Liou, S. (2018). Culture, creativity, and innovation. Journal of Cross-Cultural Psychology, 49(2), 165–170. https://doi.org/10.1177/0022022117753306s
2. Elisondo, R. (2016). Creativity is Always a Social Process. Creativity. Theories – Research - Applications, 3(2), 2016. 194-210. https://doi.org/10.1515/ctra-2016-0013

## Audience pilot: poem-only reception

The `audience-temp-pilot` reading flow presents each completed blackout poem,
with the selected words visible and the removed words obscured. Participants
receive a brief explanation of the method once, before rating. There is no
readable source panel, source toggle, source attribution, or later source-reveal
stage. The source is not disclosed after statement matching either.

The original monochrome typography and open layout are retained. The poem stays
visible in a sticky top panel while participants answer the questions; long poems
scroll within that panel. An AI interpretation appears to its right only in the
assigned condition. On narrow screens these have separate scrollable areas in
the same sticky panel. Source text remains in the assignment as layout data for
the faithful blackout rendering and source/poem joins; redacted word spans are
hidden from the accessibility tree and remain obscured in forced-color mode.
This is a presentation policy, not access control against inspecting client data.

Creativity is required in **Your overall response**, with the revised question
“How creative do you find this poem?” and the same 1–7 scale. It measures the
completed poem, rather than source-to-poem transformation. Reading all four
poems leads to statement matching, creator-AI estimates, and the post-survey.

Assignments sample two distinct `LLM` poems and two distinct `NO_AI` poems from
eligible completed, non-test Prolific submissions across the current passage
pool, then shuffle all four. Every eligible poem has an equal chance within its
condition; sources may repeat. The assignment and order remain fixed throughout
the session. Each statement trial uses decoys for that poem's actual embedded
source passage. Creator conditions are not sent to the browser.

Data compatibility:

- New assignments carry `protocolVersion: audience-poem-only-interpretation-v4`,
  `presentationVersion: blackout-only-no-source-v1`, and
  `samplingStrategy: balanced-poems-across-passages-v1`, independently of the
  configurable `AUDIENCE_PILOT_VERSION` tag.
- `roundPassageIds` preserves source IDs in presentation order. Completed
  `audience` records additionally store `assignment.rounds` entries with
  `{ round, poemId, passageId }`. Existing `poemIds` and statement option IDs stay
  available for joins to creator records. Single-valued `passageId` and
  `taskPassageId` are only retained for legacy assignments.
- `audienceSurvey.poemAnswers[].creativity` stores the new response, and the
  existing `creativityRatings` array still contains `{ poemId, rating }` for each
  poem. The final commit checks that these four pairs agree.
- New survey IDs are `audience-survey-v4` and `audience-poem-reception-v3`.
  The source passage pool version is unchanged. Historical records are not
  rewritten, and the server still accepts the previous single-source, source-visible v2, and source-with-interpretation v3
  protocols, including their exposure validation and condition fields.
- New-protocol timestamps mark captcha, consent, reading start, reading end,
  statement matching end, AI estimates end, and submission, in that order.
  Use `protocolVersion` when interpreting timestamps across pilot versions.
- Autosaves retain the full assignment and responses. Final submission flushes
  pending saves before committing; a failed HTTP response keeps the participant
  on the survey so they can retry.

`AUDIENCE_TEST` starts a dummy preview and skips both autosaves and final writes.
The existing insufficient-pool fallback also starts an explicitly labeled dummy
preview when fewer than two real poems are available in either condition.

Validation (Node 20.19+ or 22.12+):

```sh
npm run build:client
npm --prefix server run build
npm --prefix server test
```

The server tests use an in-memory Firestore stub and never write study data.


## Audience interpretation condition

Each new participant is independently assigned with probability 0.5 to `AI` or
`NO_AI`. `assignment.interpretationCondition` stays fixed for all four poems,
independently of the creator's condition. The top panel has two columns:
blackout poem and interpretation. In `NO_AI`, the second column is empty and
there is no AI label or placeholder. The poem has the same width and position
in both conditions. There is no full, readable source anywhere in this flow.

For `AI`, each poem screen waits 6,000 ms before showing **Here is one possible
interpretation from AI.** and revealing the cached paragraph one Unicode code
point every 20 ms (nominally 50 characters/second). The six-second delay uses
elapsed time; character advancement pauses while the document is hidden.
Participants may advance as soon as the questions are complete, including
before the interpretation starts or finishes. There is no chatbot or model
request from the participant's browser. The interpretation is shown only during
poem rating, not during statement matching or creator-AI estimates.

`AUDIENCE_TEST_AI` and `AUDIENCE_TEST_NO_AI` preview the two conditions;
`AUDIENCE_TEST` randomizes the condition. All use visibly identified dummy
stimuli and skip study writes, including exposure autosaves.

### Preparing interpretations after creator collection

Use Node 22.12+ with the existing Firebase admin credentials in `server/.env`.
Add `OPENROUTER_API_KEY` there (see
`server/.env.audience-interpretations.example`). Never use a `VITE_` variable for
this key. The preparation command is an administrator CLI, not a public route.

```sh
# Read-only: report eligible, already prepared, and pending counts. No model calls.
npm --prefix server run interpretations:prepare

# Generate and cache missing interpretations for the eligible completed poems.
npm --prefix server run interpretations:prepare -- --write
```

Generation uses `openai/gpt-6-astra` through OpenRouter with the revised
`blackout-interpretation-poem-only-v2` prompt. The model receives only the final
poem and a general explanation of blackout poetry. It is asked for one possible
reading grounded only in that poem, without claiming creator intent, evaluating
quality, suggesting revisions, or exceeding one paragraph of 100 words. The
exact system prompt and user template are in
`server/api/utils/audienceInterpretations.ts`. The request contains only `model` and `messages`;
temperature, top-p, reasoning, seed, token limits, and provider routing are left
at service/model defaults. No unredacted source, source title/author, creator statement, survey answer, or
creator AI label is sent. GPT-6 Astra is documented by
[OpenAI](https://developers.openai.com/api/docs/models/gpt-6-astra) and listed by
[OpenRouter](https://openrouter.ai/openai/gpt-6-astra) (checked September 7, 2026).
The command checks the live OpenRouter catalog and fails if this exact model is
absent; it never substitutes a model.

The existing creator format stores word indexes, not manually arranged lines.
Reconstruction follows the passage's word order, preserving punctuation and
embedded newlines. When an explicit `finalPoemText` string is available, its
line breaks and punctuation are preserved verbatim after verifying that its
words match the selection. Browser line wrapping is not treated as a creator
line break. The exact input and reconstruction method are saved for audit.

`audienceInterpretationAttempt` records each request before it is sent, then its
complete response, status, and any failure. `audienceInterpretation` stores
accepted paragraphs and references their attempt. Audit fields include exact
prompts/poem, poem-only input-context marker, source and poem IDs for joins,
prompt version, input-derived ID and output hash, requested
and returned model IDs, catalog metadata/canonical slug and advertised defaults,
provider, fingerprint and generation ID when disclosed, request/response/catalog
UTC dates, runtime, and full response usage/router metadata. API keys are never
stored. Undisclosed underlying model snapshots/defaults remain unknown; the
service alias alone is not a guarantee of future reproducibility.

Only complete, nonempty, single-paragraph outputs of at most 100 words are
accepted. Truncated or malformed outputs remain in the attempt audit and block
readiness. Re-running skips cached, matching stimuli and retries missing ones;
accepted stimuli are never overwritten. Changed poem/prompt inputs get new IDs. The new prompt version produces
different cache IDs, so earlier source-informed interpretations cannot be reused;
run preparation again before launching this protocol. For an intentional new generation wave, bump the prompt version before
preparing the new pool. No automatic regeneration occurs during audience use.

Both audience conditions require valid cached interpretations for **every**
eligible poem. A missing or changed stimulus returns
`AUDIENCE_INTERPRETATIONS_NOT_READY`; it does not remove that poem from sampling
or start a dummy session. Prepare the final pool before audience recruitment.
A newly eligible creator poem requires another preparation run.

### Assignment and exposure logging

- `audienceAssignment` fixes the full assignment server-side at allocation.
  Final submission verifies it is unchanged. Completed `audience.assignment`
  records retain the audience condition, presentation/display versions, and each round's
  `interpretationId` alongside the existing poem/source joins. No-AI assignments
  omit the interpretation text from the browser payload.
- `audienceSurvey.interpretationExposures` contains one record per rated poem:
  condition, stimulus ID (null for no-AI exposure), screen-open/start/complete/
  submission timestamps, scheduled delay/speed, elapsed time, displayed and
  total character counts, maximum characters rendered while the panel was in
  view, document-hidden time, and foreground panel-visible time.
- These are browser display measurements, not evidence that someone read the
  text. Viewport time means at least part of the panel intersects the viewport;
  it does not measure gaze or which words were read. Unicode code points are
  used for character counts.
- Partial exposure is autosaved at screen entry, reveal start/end, visibility
  changes, and every five seconds in the AI condition. Submission captures the
  final count immediately, including zero or partial exposure. Incomplete
  records reflect the last successful checkpoint, not an exact abandonment time.
- Existing response, creativity, statement-match, creator-AI estimate, timestamp,
  and retry behavior remains available. The server checks all four exposure
  records before accepting a v3 or v4 final submission. Historical records are not
  rewritten.

Tests cover both participant conditions and creator-condition balancing,
legacy assignments, cache readiness/staleness, immutable assignment validation,
exposure joins, prompt/transcription fidelity, generation defaults/provenance,
resumption, and rejected model responses, with mocked Firestore and OpenRouter.
