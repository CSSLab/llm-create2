import type { TimelineEvent } from "../types";

interface ChatHistoryProps {
  events: TimelineEvent[];
  eventIndex: number;
  showAll: boolean;
}

export default function ChatHistory({
  events,
  eventIndex,
  showAll,
}: ChatHistoryProps) {
  const visibleEvents = (showAll ? events : events.slice(0, eventIndex + 1)).filter(
    (event) => event.message,
  );
  const displayMessage = (content: string) =>
    content.replace(/\*\*(.*?)\*\*/gs, "$1").replace(/_(.*?)_/gs, "$1");

  return (
    <section className="ex-chat" aria-label="Assistant conversation history">
      <div className="ex-chat__heading">
        <h2>Conversation</h2>
        <p>Shown in playback order</p>
      </div>
      <div className="ex-chat__scroll">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event, index) => {
            const previousStage = visibleEvents[index - 1]?.stage;
            return (
              <div key={event.id}>
                {event.stage !== previousStage ? (
                  <p className="ex-chat__stage">
                    {event.stage === "SPARK" ? "Brainstorm" : "Writing"}
                  </p>
                ) : null}
                <article
                  className={`ex-chat__message ${
                    event.kind === "user-message" ? "is-participant" : "is-assistant"
                  }`}
                >
                  <p className="ex-chat__role">
                    {event.kind === "user-message" ? "Participant" : "Assistant"}
                  </p>
                  <p>{displayMessage(event.message?.content ?? "")}</p>
                </article>
              </div>
            );
          })
        ) : (
          <p className="ex-chat__waiting">The conversation has not begun at this point.</p>
        )}
      </div>
    </section>
  );
}
