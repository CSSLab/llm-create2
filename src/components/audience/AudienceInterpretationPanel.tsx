import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { AudiencePoem, InterpretationCondition, InterpretationExposure } from "../../types";
import { INTERPRETATION_DISPLAY } from "../../../server/api/utils/audienceInterpretationProtocol";

export interface InterpretationPanelHandle {
  finish: () => InterpretationExposure | undefined;
}

interface Props {
  poem: AudiencePoem;
  condition?: InterpretationCondition;
  onExposure: (exposure: InterpretationExposure) => void;
}

// Mount a fresh panel for each poem. This simulates display streaming from the
// fixed stimulus; no model requests or chat state exist on the audience client.
const AudienceInterpretationPanel = forwardRef<InterpretationPanelHandle, Props>(function AudienceInterpretationPanel(
  { poem, condition, onExposure }, ref,
) {
  const [count, setCount] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const tracker = useRef<{
    exposure: InterpretationExposure;
    opened: number;
    measured: number;
    hidden: boolean;
    intersects: boolean;
    finished: boolean;
  } | null>(null);
  const onExposureRef = useRef(onExposure);
  useLayoutEffect(() => { onExposureRef.current = onExposure; }, [onExposure]);
  const characters = Array.from(condition === "AI" ? poem.interpretationText ?? "" : "");

  const snapshot = (submitted = false) => {
    const state = tracker.current;
    if (!state) return undefined;
    if (state.finished) return { ...state.exposure };
    const now = performance.now();
    const duration = Math.max(0, now - state.measured);
    if (state.hidden) state.exposure.documentHiddenMs += duration;
    else if (state.intersects && state.exposure.charactersDisplayed > 0) state.exposure.panelVisibleMs += duration;
    state.measured = now;
    const timestamp = new Date().toISOString();
    state.exposure.recordedAt = timestamp;
    state.exposure.elapsedMs = now - state.opened;
    if (submitted) {
      state.finished = true;
      state.exposure.submittedAt = timestamp;
    }
    return { ...state.exposure };
  };
  useImperativeHandle(ref, () => ({ finish: () => snapshot(true) }));

  useEffect(() => {
    if (!condition) return;
    const now = performance.now();
    const timestamp = new Date().toISOString();
    tracker.current = {
      opened: now, measured: now, hidden: document.hidden, intersects: false, finished: false,
      exposure: {
        poemId: poem.id, condition,
        interpretationId: condition === "AI" ? poem.interpretationId! : null,
        displayVersion: INTERPRETATION_DISPLAY.version,
        scheduledDelayMs: INTERPRETATION_DISPLAY.delayMs,
        characterIntervalMs: INTERPRETATION_DISPLAY.characterIntervalMs,
        screenOpenedAt: timestamp, revealStartedAt: null, revealCompletedAt: null,
        recordedAt: timestamp, submittedAt: null, elapsedMs: 0,
        charactersDisplayed: 0, totalCharacters: characters.length,
        panelVisibleMs: 0, documentHiddenMs: 0, maxCharactersVisible: 0,
      },
    };
    const publish = () => {
      if (tracker.current?.finished) return;
      const entry = snapshot();
      if (entry) onExposureRef.current(entry);
    };
    const visibility = () => {
      snapshot();
      if (tracker.current) {
        tracker.current.hidden = document.hidden;
        if (!document.hidden && tracker.current.intersects) {
          tracker.current.exposure.maxCharactersVisible = tracker.current.exposure.charactersDisplayed;
        }
      }
      publish();
    };
    const observer = new IntersectionObserver(([entry]) => {
      snapshot();
      const state = tracker.current;
      if (state) {
        state.intersects = entry.isIntersecting;
        if (state.intersects && !state.hidden) {
          state.exposure.maxCharactersVisible = Math.max(state.exposure.maxCharactersVisible, state.exposure.charactersDisplayed);
        }
      }
    });
    if (panel.current) observer.observe(panel.current);
    document.addEventListener("visibilitychange", visibility);
    publish();
    let characterTimer: ReturnType<typeof setInterval> | undefined;
    const delayTimer = condition === "AI" ? setTimeout(() => {
      const advance = () => {
        if (document.hidden || tracker.current?.finished) return;
        if ((tracker.current?.exposure.charactersDisplayed ?? 0) >= characters.length) {
          clearInterval(characterTimer);
          return;
        }
        setCount((previous) => Math.min(previous + 1, characters.length));
      };
      advance();
      characterTimer = setInterval(advance, INTERPRETATION_DISPLAY.characterIntervalMs);
    }, INTERPRETATION_DISPLAY.delayMs) : undefined;
    // Retain bounded partial exposure in incomplete-session autosaves too.
    const heartbeat = condition === "AI" ? setInterval(publish, 5000) : undefined;
    return () => {
      clearTimeout(delayTimer);
      clearInterval(characterTimer);
      clearInterval(heartbeat);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
    // The parent keys this component by poem ID; answer/autosave updates must
    // never restart its six-second timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poem.id, condition]);

  useLayoutEffect(() => {
    const state = tracker.current;
    if (!state || state.finished || count === 0) return;
    snapshot();
    const first = state.exposure.charactersDisplayed === 0;
    state.exposure.charactersDisplayed = count;
    if (first) state.exposure.revealStartedAt = new Date().toISOString();
    if (!state.hidden && state.intersects) state.exposure.maxCharactersVisible = count;
    const complete = count === state.exposure.totalCharacters;
    if (complete) state.exposure.revealCompletedAt = new Date().toISOString();
    if (first || complete) onExposureRef.current({ ...state.exposure });
  }, [count]);

  // No label, placeholder, border or accessible AI announcement in NO_AI.
  return (
    <div ref={panel} className="h-[20dvh] min-w-0 overflow-y-auto md:h-auto md:max-h-[calc(55dvh-2rem)]" data-interpretation-slot>
      {condition === "AI" && count > 0 && (
        <aside className="border-t border-light-grey-2 pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0" aria-label={INTERPRETATION_DISPLAY.heading}>
          <h2 className="text-sm font-semibold leading-relaxed text-dark-grey">{INTERPRETATION_DISPLAY.heading}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-dark-grey xl:text-base" aria-live="off">
            {characters.slice(0, count).join("")}
          </p>
        </aside>
      )}
    </div>
  );
});

export default AudienceInterpretationPanel;
