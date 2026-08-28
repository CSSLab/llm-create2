import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ArtistCondition } from "../../types";
import type { ExhibitionDataset, ExhibitionParticipant } from "../types";
import { average, formatDuration, getPoemTitle } from "../utils";
import BlackoutText from "./BlackoutText";
import ExhibitionHeader from "./ExhibitionHeader";
import StarMark from "./StarMark";

type ConditionFilter = "ALL" | ArtistCondition;
const PAGE_SIZE = 12;

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(ordered.length / 2);
  return ordered.length % 2
    ? ordered[midpoint]
    : (ordered[midpoint - 1] + ordered[midpoint]) / 2;
};

interface PoemPreviewProps {
  participant: ExhibitionParticipant;
  featured?: boolean;
  index: number;
  onOpen: () => void;
}

function PoemPreview({
  participant,
  featured = false,
  index,
  onOpen,
}: PoemPreviewProps) {
  const totalMs = participant.poem.taskTiming?.totalDurationMs;
  const selectionCount = participant.poem.text.length;

  return (
    <article className={`ex-preview ${featured ? "ex-preview--featured" : ""}`}>
      <p className="ex-preview__index">Poem {String(index + 1).padStart(2, "0")}</p>
      <button
        aria-label={`Open ${getPoemTitle(participant)}`}
        className="ex-preview__frame"
        onClick={onOpen}
        type="button"
      >
        <BlackoutText
          compact={!featured}
          passage={participant.poem.passage.text}
          visibleIndexes={participant.poem.text}
        />
        <span className="ex-preview__open">View process <span aria-hidden="true">→</span></span>
      </button>
      <div className="ex-preview__meta">
        <p>
          <span>Source: </span>
          {participant.poem.passage.author}, <em>{participant.poem.passage.title}</em>
        </p>
        <p>
          {selectionCount} selections <span aria-hidden="true">·</span>{" "}
          {formatDuration(totalMs)} <span aria-hidden="true">·</span>{" "}
          {participant.condition === "LLM" ? "With AI" : "Without AI"}
        </p>
      </div>
    </article>
  );
}

export default function ExhibitionGallery({ dataset }: { dataset: ExhibitionDataset }) {
  const navigate = useNavigate();
  const [condition, setCondition] = useState<ConditionFilter>("ALL");
  const [passageId, setPassageId] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const passages = useMemo(() => {
    const byId = new Map<string, { id: string; title: string; author: string }>();
    dataset.participants.forEach(({ poem }) => {
      byId.set(poem.passageId, {
        id: poem.passageId,
        title: poem.passage.title,
        author: poem.passage.author,
      });
    });
    return [...byId.values()];
  }, [dataset.participants]);

  const filtered = useMemo(
    () =>
      dataset.participants.filter(
        (participant) =>
          (condition === "ALL" || participant.condition === condition) &&
          (passageId === "ALL" || participant.poem.passageId === passageId),
      ),
    [condition, dataset.participants, passageId],
  );
  const visibleParticipants = filtered.slice(0, visibleCount);
  const remainingCount = filtered.length - visibleParticipants.length;

  const llmCount = dataset.participants.filter(
    (participant) => participant.condition === "LLM",
  ).length;
  const noAiCount = dataset.participants.length - llmCount;
  const durations = dataset.participants
    .map(({ poem }) => poem.taskTiming?.totalDurationMs)
    .filter((value): value is number => typeof value === "number");
  const selectionCounts = dataset.participants.map(({ poem }) => poem.text.length);
  const editCounts = dataset.participants.map(({ poem }) => poem.editHistory.length);
  const expressiveRealization = average(
    dataset.participants.map(({ outcomes }) => outcomes.expressive_realization),
  );
  const creativitySupport = average(
    dataset.participants.map(({ outcomes }) => outcomes.csi_able_to_be_creative),
  );
  const roomMetrics = [
    ["Median making time", formatDuration(median(durations))],
    ["Source passages", String(passages.length)],
    [
      "Words kept",
      selectionCounts.length
        ? `${Math.min(...selectionCounts)}–${Math.max(...selectionCounts)}`
        : "—",
    ],
    ["Median edit events", String(median(editCounts) ?? "—")],
    [
      "Expressive realization",
      expressiveRealization === null ? "—" : `${expressiveRealization.toFixed(1)}/7`,
    ],
    [
      "Felt able to create",
      creativitySupport === null ? "—" : `${creativitySupport.toFixed(1)}/10`,
    ],
  ];

  return (
    <div className="ex-shell">
      <ExhibitionHeader />
      <main className="ex-gallery">
        <section className="ex-gallery__intro">
          <div>
            <h1>An evolving archive</h1>
            <p className="ex-gallery__dek">
              Blackout poems, their source passages, and the choices that brought them into view.
            </p>
            <p className="ex-gallery__cohort">
              {dataset.participants.length} poems in view · {noAiCount} without AI · {llmCount} with AI
              {dataset.isPreview ? <span className="ex-preview-flag">Preview data</span> : null}
            </p>
          </div>
          <div className="ex-gallery__filters">
            <div aria-label="Filter poems by condition" className="ex-filter-links" role="group">
              {([
                ["ALL", "All"],
                ["NO_AI", "Without AI"],
                ["LLM", "With AI"],
              ] as const).map(([value, label]) => (
                <button
                  aria-pressed={condition === value}
                  className={condition === value ? "is-active" : ""}
                  key={value}
                  onClick={() => {
                    setCondition(value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="ex-passage-filter">
              <span>Source passage</span>
              <select
                value={passageId}
                onChange={(event) => {
                  setPassageId(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <option value="ALL">All passages</option>
                {passages.map((passage) => (
                  <option key={passage.id} value={passage.id}>
                    {passage.title} — {passage.author}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section aria-labelledby="room-reading-title" className="ex-room-reading">
          <div className="ex-room-reading__heading">
            <h2 id="room-reading-title">A reading of the room</h2>
            <p>Descriptive overview · updates as new work enters the archive</p>
          </div>
          <dl>
            {roomMetrics.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {filtered.length > 0 ? (
          <>
            <section aria-label="Poem gallery" className="ex-gallery__grid">
              {visibleParticipants.map((participant, index) => (
                <PoemPreview
                  featured={index === 0}
                  index={dataset.participants.indexOf(participant)}
                  key={participant.id}
                  onOpen={() => navigate(`/exhibition/${participant.id}`)}
                  participant={participant}
                />
              ))}
            </section>
            <section aria-live="polite" className="ex-gallery__more">
              <p>
                Showing {visibleParticipants.length} of {filtered.length} poems
              </p>
              {remainingCount > 0 ? (
                <button
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  type="button"
                >
                  View {Math.min(PAGE_SIZE, remainingCount)} more
                </button>
              ) : null}
            </section>
          </>
        ) : (
          <section className="ex-gallery__empty">
            <StarMark />
            <h2>No poems in this part of the room.</h2>
            <button
              onClick={() => {
                setCondition("ALL");
                setPassageId("ALL");
                setVisibleCount(PAGE_SIZE);
              }}
              type="button"
            >
              Clear filters
            </button>
          </section>
        )}
      </main>
      <footer className="ex-footer">
        <StarMark className="ex-footer__star" />
        <p><span>Lost in Translation</span> — Human expression in the age of AI.</p>
      </footer>
    </div>
  );
}
