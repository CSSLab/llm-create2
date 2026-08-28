import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { ExhibitionDataset, ExhibitionParticipant } from "../types";
import {
  average,
  buildTimeline,
  getPoemTitle,
  replaySelections,
} from "../utils";
import BlackoutText from "./BlackoutText";
import ChatHistory from "./ChatHistory";
import ExhibitionHeader from "./ExhibitionHeader";
import ProcessTimeline from "./ProcessTimeline";
import StarMark from "./StarMark";

const asScore = (value: unknown, maximum: number) =>
  typeof value === "number" ? `${value}/${maximum}` : "—";

const emotionText = (value: unknown) => {
  if (!value || typeof value !== "object") return "—";
  const emotion = value as { emotion?: string; intensity?: number };
  return emotion.emotion
    ? `${emotion.emotion}${typeof emotion.intensity === "number" ? ` · ${emotion.intensity}/5` : ""}`
    : "—";
};

function MakerAccount({ participant }: { participant: ExhibitionParticipant }) {
  const outcomes = participant.outcomes;
  const ownership = average([
    outcomes.ownership_own_work,
    outcomes.ownership_responsibility,
    outcomes.ownership_personal_connection,
    outcomes.ownership_emotional_connection,
  ]);
  const completedRequests = (participant.poem.llmUsage?.requests ?? []).filter(
    (request) => request.status === "COMPLETED",
  );
  const participantMessages = [
    ...(participant.poem.sparkConversation ?? []),
    ...(participant.poem.writeConversation ?? []),
  ].filter((message) => message.role === "user");
  const exchangeCount = completedRequests.length || participantMessages.length;
  const stages = new Set(completedRequests.map((request) => request.stage));

  return (
    <aside className="ex-account">
      <h2>The maker’s account</h2>
      <div className="ex-account__meaning">
        <p className="ex-label">Intended meaning</p>
        <p>
          {typeof outcomes.final_intended_meaning === "string"
            ? outcomes.final_intended_meaning
            : "No response recorded."}
        </p>
      </div>
      <dl>
        <div>
          <dt>Felt emotion</dt>
          <dd>{emotionText(outcomes.felt_emotion)}</dd>
        </div>
        <div>
          <dt>Expressive realization</dt>
          <dd>{asScore(outcomes.expressive_realization, 7)}</dd>
        </div>
        <div>
          <dt>Ownership</dt>
          <dd>{ownership === null ? "—" : `${ownership.toFixed(1)}/7`}</dd>
        </div>
        <div>
          <dt>Creative control</dt>
          <dd>{asScore(outcomes.creative_control, 5)}</dd>
        </div>
        <div>
          <dt>Mental effort</dt>
          <dd>{asScore(outcomes.mental_effort, 5)}</dd>
        </div>
      </dl>
      {participant.condition === "LLM" ? (
        <div className="ex-account__ai">
          <p className="ex-label">AI process</p>
          <p>
            {exchangeCount} {exchangeCount === 1 ? "exchange" : "exchanges"}
            {stages.size > 0
              ? ` · used in ${[...stages]
                  .map((stage) => (stage === "SPARK" ? "brainstorming" : "writing"))
                  .join(" and ")}`
              : " · conversation recorded alongside the poem"}
          </p>
        </div>
      ) : null}
    </aside>
  );
}

interface PoemDetailProps {
  dataset: ExhibitionDataset;
  participant: ExhibitionParticipant;
}

function PoemDetail({ dataset, participant }: PoemDetailProps) {
  const navigate = useNavigate();
  const participantIndex = dataset.participants.findIndex(
    (item) => item.id === participant.id,
  );
  const events = useMemo(() => buildTimeline(participant), [participant]);
  const [eventIndex, setEventIndex] = useState(() => Math.max(0, events.length - 1));
  const [isPlaying, setIsPlaying] = useState(false);
  const [processMode, setProcessMode] = useState(false);
  const currentEvent = events[eventIndex];
  const visibleIndexes = processMode
    ? replaySelections(participant, events, eventIndex)
    : participant.poem.text;
  const hasChat = participant.condition === "LLM";

  const goToParticipant = (index: number) => {
    const target = dataset.participants[index];
    if (target) navigate(`/exhibition/${target.id}`);
  };

  return (
    <div className="ex-shell ex-shell--detail">
      <ExhibitionHeader detail />
      <main className="ex-detail">
        <section className={`ex-detail__poem ${hasChat ? "has-chat" : ""}`}>
          <div className="ex-poem-panel">
            <div className="ex-poem-nav">
              <button
                aria-label="Previous poem"
                disabled={participantIndex === 0}
                onClick={() => goToParticipant(participantIndex - 1)}
                type="button"
              >
                <span aria-hidden="true">←</span>
              </button>
              <p>Poem {String(participantIndex + 1).padStart(2, "0")} of {String(dataset.participants.length).padStart(2, "0")}</p>
              <button
                aria-label="Next poem"
                disabled={participantIndex === dataset.participants.length - 1}
                onClick={() => goToParticipant(participantIndex + 1)}
                type="button"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <h1>{getPoemTitle(participant)}</h1>
            <p className="ex-poem-panel__source">
              after {participant.poem.passage.author}, <em>{participant.poem.passage.title}</em>
            </p>
            <p className="ex-poem-panel__condition">
              {participant.condition === "LLM" ? "Created with AI" : "Created without AI"}
            </p>
            <BlackoutText
              activeWordIndex={processMode ? currentEvent?.wordIndex : undefined}
              passage={participant.poem.passage.text}
              visibleIndexes={visibleIndexes}
            />
          </div>

          {hasChat ? (
            <ChatHistory
              eventIndex={eventIndex}
              events={events}
              showAll={!processMode}
            />
          ) : null}
          <MakerAccount participant={participant} />
        </section>

        <ProcessTimeline
          eventIndex={eventIndex}
          events={events}
          isPlaying={isPlaying}
          onEventIndexChange={setEventIndex}
          onPlayingChange={setIsPlaying}
          onProcessMode={() => {
            setIsPlaying(false);
            setProcessMode((value) => !value);
          }}
          processMode={processMode}
          totalDurationMs={participant.poem.taskTiming?.totalDurationMs}
        />
      </main>
      <footer className="ex-footer ex-footer--detail">
        <StarMark className="ex-footer__star" />
        <p><span>The Blackout Room</span> is a research exhibition of creative process.</p>
      </footer>
    </div>
  );
}

export default function PoemDetailRoute({ dataset }: { dataset: ExhibitionDataset }) {
  const { participantId } = useParams();
  const participant = dataset.participants.find((item) => item.id === participantId);
  if (!participant) return <Navigate replace to="/exhibition" />;
  return <PoemDetail dataset={dataset} key={participant.id} participant={participant} />;
}
