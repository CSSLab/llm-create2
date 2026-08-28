import { useEffect } from "react";
import type { TimelineEvent } from "../types";
import { formatDuration } from "../utils";

interface ProcessTimelineProps {
  eventIndex: number;
  events: TimelineEvent[];
  isPlaying: boolean;
  onEventIndexChange: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onProcessMode: () => void;
  processMode: boolean;
  totalDurationMs?: number | null;
}

const tickSymbol = (event: TimelineEvent) => {
  if (event.kind === "add") return "+";
  if (event.kind === "remove") return "×";
  if (event.kind === "undo") return "↶";
  if (event.kind === "redo") return "↷";
  if (event.kind === "user-message") return "u";
  if (event.kind === "assistant-message") return "a";
  if (event.kind === "chat-open") return "○";
  return "│";
};

export default function ProcessTimeline({
  eventIndex,
  events,
  isPlaying,
  onEventIndexChange,
  onPlayingChange,
  onProcessMode,
  processMode,
  totalDurationMs,
}: ProcessTimelineProps) {
  const maxIndex = Math.max(0, events.length - 1);
  const currentEvent = events[eventIndex];
  const eventDuration = events.at(-1)?.atMs ?? 0;
  const durationMs = Math.max(totalDurationMs ?? 0, eventDuration, 1);

  useEffect(() => {
    if (!isPlaying || events.length === 0) return;
    const timer = window.setInterval(() => {
      onEventIndexChange(eventIndex >= maxIndex ? 0 : eventIndex + 1);
    }, 900);
    return () => window.clearInterval(timer);
  }, [eventIndex, events.length, isPlaying, maxIndex, onEventIndexChange]);

  return (
    <section className="ex-timeline" aria-label="Poem creation playback">
      <div className="ex-timeline__topline">
        <div>
          <h2>How the poem emerged</h2>
          <p className="ex-timeline__event">
            {currentEvent
              ? `${formatDuration(currentEvent.atMs)} · ${currentEvent.label}`
              : "No recorded events"}
          </p>
        </div>
        <div className="ex-timeline__legend" aria-label="Timeline legend">
          <span><b>+</b> Add</span>
          <span><b>×</b> Remove</span>
          <span><b>↶</b> Undo</span>
          <span><b>u/a</b> Chat</span>
        </div>
        <div className="ex-mode-links" role="group" aria-label="Poem view">
          <button
            aria-pressed={!processMode}
            className={!processMode ? "is-active" : ""}
            onClick={() => processMode && onProcessMode()}
            type="button"
          >
            Final poem
          </button>
          <span aria-hidden="true">/</span>
          <button
            aria-pressed={processMode}
            className={processMode ? "is-active" : ""}
            onClick={() => !processMode && onProcessMode()}
            type="button"
          >
            Process view
          </button>
        </div>
      </div>

      <div className="ex-timeline__controls">
        <button
          aria-label={isPlaying ? "Pause playback" : "Play creation sequence"}
          className="ex-play"
          disabled={events.length === 0}
          onClick={() => {
            if (!processMode) onProcessMode();
            onPlayingChange(!isPlaying);
          }}
          type="button"
        >
          <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
        </button>
        <button
          aria-label="Previous event"
          className="ex-step"
          disabled={eventIndex <= 0}
          onClick={() => onEventIndexChange(Math.max(0, eventIndex - 1))}
          type="button"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          aria-label="Next event"
          className="ex-step"
          disabled={eventIndex >= maxIndex}
          onClick={() => onEventIndexChange(Math.min(maxIndex, eventIndex + 1))}
          type="button"
        >
          <span aria-hidden="true">→</span>
        </button>
        <p className="ex-timeline__time">
          {formatDuration(currentEvent?.atMs ?? 0)} <span>/ {formatDuration(durationMs)}</span>
        </p>
        <div className="ex-scrubber-wrap">
          <div className="ex-ticks" aria-hidden="true">
            {events.map((event, index) => (
              <span
                className={`ex-tick ex-tick--${event.kind} ${index === eventIndex ? "is-current" : ""}`}
                key={event.id}
                style={{ left: `${Math.min(100, (event.atMs / durationMs) * 100)}%` }}
              >
                {tickSymbol(event)}
              </span>
            ))}
          </div>
          <input
            aria-label="Creation event"
            disabled={events.length === 0}
            max={maxIndex}
            min={0}
            onChange={(event) => {
              onPlayingChange(false);
              onEventIndexChange(Number(event.target.value));
            }}
            step={1}
            type="range"
            value={Math.min(eventIndex, maxIndex)}
          />
          <div className="ex-scrubber-scale">
            <span>0:00</span>
            <span>{formatDuration(durationMs)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
