interface BlackoutTextProps {
  passage: string;
  visibleIndexes: number[];
  activeWordIndex?: number;
  compact?: boolean;
}

export default function BlackoutText({
  passage,
  visibleIndexes,
  activeWordIndex,
  compact = false,
}: BlackoutTextProps) {
  const visible = new Set(visibleIndexes);
  const words = passage.split(" ");

  return (
    <div className={`ex-blackout ${compact ? "ex-blackout--compact" : ""}`}>
      {words.map((word, index) => {
        const isVisible = visible.has(index);
        const isActive = activeWordIndex === index;
        return (
          <span key={`${index}-${word}`}>
            <span
              className={`ex-blackout__word ${isVisible ? "is-visible" : "is-covered"} ${isActive ? "is-active" : ""}`}
            >
              {word}
            </span>{" "}
          </span>
        );
      })}
    </div>
  );
}
