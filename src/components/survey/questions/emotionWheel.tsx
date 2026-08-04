import type {
  EmotionWheelAnswer,
  EmotionWheelQuestion,
} from "../../../types";
import { NO_EMOTION } from "../../../consts/genevaEmotionWheel";

interface Props {
  question: EmotionWheelQuestion;
  value: EmotionWheelAnswer | undefined;
  onChange: (id: string, value: EmotionWheelAnswer) => void;
}

const toPosition = (angle: number, radius: number) => ({
  left: `${50 + radius * Math.cos(angle)}%`,
  top: `${50 + radius * Math.sin(angle)}%`,
});

const EmotionWheel = ({ question, value, onChange }: Props) => {
  const optionCount = question.options.length;

  return (
    <fieldset className="mb-8 w-full space-y-4">
      <legend className="text-main">
        {question.question}
        {question.required ? <span className="text-red-700">*</span> : null}
      </legend>

      <p className="text-sub">
        Choose one circle. Intensity increases from 1 near the centre to 5 at
        the outside.
      </p>

      <div className="mx-auto w-[min(100%,35rem)] px-1 sm:px-4">
        <div
          className="relative aspect-square w-full select-none"
          role="radiogroup"
          aria-label={question.question}
        >
          <div className="absolute inset-[13%] rounded-full border border-light-grey-3" />
          <div className="absolute inset-[8.5%] rounded-full border border-light-grey-3" />

          {question.options.map((emotion, emotionIndex) => {
            // The official GEW has the positive and negative families meeting
            // at the top. Interest begins just clockwise from the vertical.
            const angle =
              (emotionIndex / optionCount) * Math.PI * 2 -
              Math.PI / 2 +
              Math.PI / optionCount;
            const labelPosition = toPosition(angle, 43);
            const emotionSelected = value?.emotion === emotion;

            return (
              <div key={emotion}>
                <div
                  aria-hidden="true"
                  className="absolute h-px origin-left bg-light-grey-3"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: "34%",
                    transform: `rotate(${angle}rad)`,
                  }}
                />

                {[1, 2, 3, 4, 5].map((intensity) => {
                  const dotPosition = toPosition(angle, 12 + intensity * 4.5);
                  const selected =
                    emotionSelected && value.intensity === intensity;
                  const dotSize = 6 + intensity * 2;

                  return (
                    <button
                      key={intensity}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${emotion}, intensity ${intensity} of 5`}
                      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-grey ${
                        selected
                          ? "scale-125 border-dark-grey bg-dark-grey"
                          : "border-grey bg-white hover:scale-125 hover:bg-light-grey-3"
                      }`}
                      style={{
                        ...dotPosition,
                        width: `${dotSize}px`,
                        height: `${dotSize}px`,
                      }}
                      onClick={() =>
                        onChange(question.id, {
                          emotion,
                          intensity: intensity as 1 | 2 | 3 | 4 | 5,
                        })
                      }
                    />
                  );
                })}

                <span
                  className={`absolute z-10 w-[22%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[8px] leading-tight sm:w-[17%] sm:text-[11px] ${
                    emotionSelected
                      ? "font-semibold text-dark-grey"
                      : "text-grey"
                  }`}
                  style={labelPosition}
                >
                  {emotion}
                </span>
              </div>
            );
          })}

          <button
            type="button"
            role="radio"
            aria-checked={value?.emotion === NO_EMOTION}
            className={`absolute left-1/2 top-1/2 z-20 flex aspect-square w-[18%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border px-1 text-center text-[9px] leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-grey sm:text-xs ${
              value?.emotion === NO_EMOTION
                ? "border-dark-grey bg-dark-grey text-white"
                : "border-light-grey-1 bg-white text-dark-grey hover:bg-light-grey-4"
            }`}
            onClick={() =>
              onChange(question.id, {
                emotion: NO_EMOTION,
                intensity: 0,
              })
            }
          >
            No emotion
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-grey">
        <span>Lower intensity</span>
        {[1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            className="flex items-center justify-center rounded-full border border-grey"
            style={{ width: 6 + level * 2, height: 6 + level * 2 }}
            aria-hidden="true"
          />
        ))}
        <span>Higher intensity</span>
      </div>

      {value ? (
        <p className="text-center text-sm text-dark-grey" aria-live="polite">
          Selected: {value.emotion}
          {value.intensity > 0 ? ` · intensity ${value.intensity} of 5` : ""}
        </p>
      ) : null}
    </fieldset>
  );
};

export default EmotionWheel;
