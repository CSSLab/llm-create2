# Artist-side data logging

This document is the source of truth for data collected during the artist/creator flow. The current schema version is `artist-data-2026-09-02-v3`, stored as `poem.loggingSchemaVersion` and copied to the final `poem` document.

## Storage flow

1. The client initializes an `Artist` record and an empty `Poem` after assignment.
2. Page transitions append to `artistData.timeStamps`. The SPARK and WRITE pages additionally store structured `taskTiming` records.
3. SPARK and WRITE interaction data is accumulated in React refs so high-frequency interaction logging does not cause UI rerenders. It is copied into the poem when that stage completes.
4. `addRoleSpecificData` updates the in-memory record and schedules a 500 ms autosave to `artistIncompleteSession/{sessionId}`.
5. Post-survey submission sends a compact payload and commits one atomic batch containing linked `artist`, `artistSurvey`, and `poem` documents. The server restores compatibility aliases before writing, so the stored schema remains stable. The incomplete-session document is retained between poems and deleted after poem 3.

Consequently, the final dataset contains complete stage data for submitted sessions. If someone closes the page before a stage completes, interactions that occurred during that unfinished stage may not be present in the last autosave. `sessionStorage.userDataSnapshot` is only a best-effort local backup on unload; it is not part of the analysis dataset.

All JavaScript `Date` values become ISO date strings when sent as JSON. Analysis code should parse them as timestamps.

## Final Firestore records

### `artist`

| Field | Meaning |
| --- | --- |
| `condition` | `LLM` or `NO_AI`. |
| `assignment` | Condition strategy, task/tutorial passage IDs, passage-pool version, and assignment time. |
| `surveyResponse` | Reference to the corresponding `artistSurvey` document. |
| `poem` | Reference to the corresponding `poem` document. |
| `timestamps` | General route/progress timestamps retained for compatibility. Prefer `poem.taskTiming` for phase-duration analysis. |
| `prolific` | Prolific identifiers when the session originated on Prolific. |

### `artistSurvey`

Stores the exact pre- and post-survey definitions alongside `preSurveyAnswers` and `postSurveyAnswers`. Keeping the definitions makes each response interpretable if question wording or scales change later.

### `poem`

| Field | Meaning |
| --- | --- |
| `loggingSchemaVersion` | Artist logging schema used by the record. |
| `passageId`, `taskPassageId` | Passage used for the measured poem task. |
| `tutorialPassageId` | Passage sampled for the tutorial. |
| `passage` | Full task passage and attribution metadata. |
| `text`, `selectedWordIndexes` | Final selected zero-based word indexes. These are duplicate names retained for compatibility. |
| `finalPoem` | Final selected words joined in passage order. |
| `snapshot`, `editHistory` | Full word-selection event history. These are duplicate names retained for compatibility. |
| `sparkNotes`, `writeNotes` | Notes at the end of each phase. |
| `sparkConversation` | Chat transcript as of the end of SPARK. |
| `writeConversation` | Running chat transcript as of the end of WRITE; it includes earlier SPARK messages. Use message IDs to deduplicate if combining both arrays. |
| `taskTiming` | SPARK, WRITE, and total task timestamps/durations. |
| `llmUsage` | Availability, input activity, and request-level logs described below. |
| `derivedMetrics` | Analysis-ready measures calculated at final submission. |
| `random` | Server-generated random value used for random ordering/sampling. |

## Poem editing log

Each entry in `snapshot`/`editHistory` contains:

| Field | Values and meaning |
| --- | --- |
| `action` | `ADD` or `REMOVE`. |
| `index` | Zero-based index of the affected passage word. |
| `timestamp` | Client event time. |
| `source` | `DIRECT`, `UNDO`, or `REDO`. |

The final `text` indexes are the authoritative final state. The event history is used for process measures such as additions, removals, reversals, undo/redo use, and time to first/final edit.

## Chat transcript

Every new message has the following provenance fields in addition to `id`, `role`, `content`, and `timestamp`:

| Field | Values and meaning |
| --- | --- |
| `stage` | `SPARK` or `WRITE`. |
| `kind` | `USER_MESSAGE`, `LLM_RESPONSE`, `STAGE_OPENING`, or `IDLE_NUDGE`. |
| `inputSource` | Present on user messages: `TYPED` or `SUGGESTION`. |

`STAGE_OPENING` is added when the instructions close and the chat becomes usable. It is no longer created while the instructions are still covering the page. `IDLE_NUDGE` is added after 40 seconds without a user message in that stage. These messages are generated locally and do not create LLM API requests.

The explicit `kind` and `stage` fields are authoritative for determining whether the SPARK/WRITE opening or idle-nudge message was shown. Do not identify automated messages by matching their text; copy can change between deployments.

## `llmUsage`

### `promptDefinition`

The exact shared prompt material is stored once per poem instead of being repeated in every request. It contains `promptVersion`, `systemPromptTemplate`, the SPARK/WRITE `stageInstructions`, and the `contextTemplate`. Combine that definition with the poem passage, each request's `stage`, and its `selectedWordIndexes` to reconstruct the exact system prompt. Older records may instead contain the full `systemPrompt` on every request.

### `chatAvailability`

One record per reached LLM-enabled stage:

```ts
{
  stage: "SPARK" | "WRITE";
  availableAt: Date;
}
```

This replaces the misleading `chatOpenings` name. It means the always-visible chat panel became usable after the instructions closed; it does not mean the participant clicked or opened the panel.

### `inputActivity`

One privacy-preserving aggregate per stage:

| Field | Meaning |
| --- | --- |
| `stage` | `SPARK` or `WRITE`. |
| `firstFocusedAt` | First time the participant focused the chat textarea. Missing if never focused. |
| `focusCount` | Number of textarea focus events. This can include keyboard tabbing and should not alone be treated as substantive engagement. |
| `firstTypedAt` | First transition from blank/whitespace-only input to nonblank input. Missing if no nonblank draft was started. |
| `draftStartCount` | Number of blank-to-nonblank draft starts. Sending a typed message resets the draft, so later typing begins another draft. |
| `abandonedDraftCount` | Drafts cleared without typed submission. This includes replacing an existing typed draft by clicking a suggested prompt. |
| `hasUnsentDraft` | Whether nonblank text remained in the textarea at the last stage save. In a completed stage, this means the stage ended with an unsent draft. |

No keystroke stream and no unsent/deleted draft text is stored. Submitted message text remains available in the transcript and request log.

### `requests`

One record per attempted LLM request. The same `id` is updated as the request moves through its lifecycle.

| Field | Meaning |
| --- | --- |
| `id`, `userMessageId`, `assistantMessageId` | IDs linking request and transcript messages. `assistantMessageId` exists only after success. |
| `stage` | Stage in which the request was made. |
| `inputSource` | `TYPED` or `SUGGESTION`. This is recorded even when the request fails. |
| `userMessageContent` | Submitted content only; never an abandoned draft. |
| `requestedAt`, `completedAt`, `failedAt` | Request lifecycle timestamps. |
| `status` | `STARTED`, `COMPLETED`, or `FAILED`. |
| `promptVersion`, `selectedWordIndexes` | Prompt version and the dynamic word-selection state for exact prompt reconstruction with `llmUsage.promptDefinition`. Legacy records may contain a full `systemPrompt` here instead. |
| `model`, `modelVersion`, `generationParameters` | Server-returned generation metadata when available. |
| `error` | Failure text when the request fails. |

Failed optimistic user messages are removed from the displayed transcript and restored to the textarea for retry, while the failed request remains in `llmUsage.requests`.

## Derived metrics

`deriveArtistMetrics` creates the following fields at final submission.

### Poem process and timing

| Metric | Definition |
| --- | --- |
| `selectedWordCount` | Number of unique final selected indexes. |
| `additionCount`, `removalCount` | Counts of `ADD` and `REMOVE` edit events. |
| `reversalCount` | Number of times the same word's action changes between consecutive actions on that word. |
| `undoCount`, `redoCount` | Edit events generated by undo/redo. |
| `totalEditingActivity` | Total edit-event count. |
| `timeToFirstSelectionMs` | WRITE start to first `ADD`; otherwise `null`. |
| `timeToFinalEditMs` | WRITE start to last edit; otherwise `null`. |
| `totalTaskTimeMs`, `sparkTimeMs`, `writeTimeMs` | Stored phase durations; otherwise `null`. |

### LLM use

| Metric | Definition |
| --- | --- |
| `llmUptake` | At least one completed LLM request. |
| `llmTurnCount` | Completed request count. |
| `llmAttemptCount` | All request attempts, including failures. |
| `llmTypedAttemptCount` | Attempts submitted from typed input. |
| `llmSuggestionAttemptCount` | Attempts submitted by clicking a suggested prompt. |
| `chatAvailableStageCount` | Number of stages in which chat became usable. It is exposure, not engagement. |

### Chat engagement and automated messages

The following fields exist separately with `spark` and `write` prefixes:

| Suffix | Definition |
| --- | --- |
| `ChatAvailable` | Chat became usable in that stage. |
| `ChatFocusCount` | Textarea focus count. |
| `ChatEverTyped` | A nonblank draft was started. |
| `ChatDraftStartCount` | Blank-to-nonblank draft starts. |
| `ChatAbandonedDraftCount` | Drafts cleared or replaced without typed submission. |
| `ChatEndedWithUnsentDraft` | Stage ended with a nonblank unsent draft. |
| `TimeFromChatAvailableToFirstFocusMs` | Availability to first focus; `null` if either timestamp is absent. |
| `TimeFromChatAvailableToFirstTypingMs` | Availability to first nonblank input; `null` if either timestamp is absent. |
| `StageOpeningShown` | Transcript contains that stage's typed `STAGE_OPENING` message. |
| `IdleNudgeShown` | Transcript contains that stage's typed `IDLE_NUDGE` message. |

The aggregate fields `chatFocusCount`, `chatDraftStartCount`, and `chatAbandonedDraftCount` sum SPARK and WRITE.

For the `NO_AI` condition, current-schema chat measures are false or zero because chat is not available. Analyses of chat behavior should ordinarily be restricted to the `LLM` condition.

## Versioning and legacy data

Records should be grouped or filtered using `loggingSchemaVersion` before comparing logging-dependent metrics.

- Current records use `artist-data-2026-09-02-v3`; detailed v2 records remain supported.
- Older `chatOpenings` records are read as `chatAvailability` so the exposure timestamp remains usable.
- Older messages do not have `stage`/`kind`, and older requests do not have `inputSource`. The new provenance, input-activity, and automated-message derived metrics are therefore emitted as `null` when those detailed fields are absent; `null` means unmeasured, not zero.

## Analysis guidance

- Use `ChatEverTyped`, request counts, and message provenance as the primary engagement measures. Treat focus counts as weaker evidence because focus can occur without intentional use.
- Use `llmAttemptCount` when studying attempted reliance and `llmTurnCount` when studying completed exchanges.
- Use `inputSource` to separate participant-authored requests from interface-suggested requests.
- Use `IdleNudgeShown` when estimating effects of the nudge; it is post-treatment and depends on 40 seconds of no submitted user message.
- Use `passagePoolVersion`, task passage ID, and condition in all passage- or condition-sensitive analyses.
- Deduplicate combined transcript arrays by `message.id`, because `writeConversation` already carries the SPARK history forward.

## Implementation map

- Types and schema: `src/types.ts`
- Schema-version constant: `src/consts/dataLogging.ts`
- Prompt definition and reconstruction: `src/consts/blackoutAssistantPrompt.ts`
- Automated message creation: `src/consts/chatMessages.ts`
- Chat collection logic: `src/components/chatbot/Chatbot.tsx`
- SPARK/WRITE stage aggregation: `src/pages/artist/step1/Step1.tsx` and `src/pages/artist/step2/Step2.tsx`
- Compact final export: `src/utils/artistPayload.ts` and `src/pages/artist/PostSurvey.tsx`
- Derived measures: `src/utils/artistMetrics.ts`
- Legacy `chatOpenings` conversion: `src/utils/llmUsage.ts`
- Firestore autosave/commit: `src/App.tsx`, `server/api/utils/artistPayload.ts`, and `server/api/routes/firebaseAPI.ts`
