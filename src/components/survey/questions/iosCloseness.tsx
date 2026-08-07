import type { IosClosenessQuestion } from "../../../types";

interface Props {
  question: IosClosenessQuestion;
  value: number | undefined;
  onChange: (id: string, value: number) => void;
}

const CENTRE_OFFSETS = [27, 23, 19, 15, 11, 7, 3];
const CIRCLE_RADIUS = 22;
const VIEWBOX_CENTRE = 56;

const IosCloseness = ({ question, value, onChange }: Props) => (
  <fieldset className="mb-8 w-full space-y-4">
    <legend className="text-main">
      {question.question}
      {question.required ? <span className="text-red-700">*</span> : null}
    </legend>

    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      role="radiogroup"
      aria-label={question.question}
    >
      {CENTRE_OFFSETS.map((centreOffset, index) => {
        const optionValue = index + 1;
        const selected = value === optionValue;
        const dimmed = !selected && value !== undefined;
        const labelShift = Math.max(0, 14 - centreOffset);
        const leftCentre = VIEWBOX_CENTRE - centreOffset;
        const rightCentre = VIEWBOX_CENTRE + centreOffset;

        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Connection ${optionValue} of 7`}
            onClick={() => onChange(question.id, optionValue)}
            className={`rounded-lg border px-2 py-3 text-center transition-all duration-150 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-grey ${
              selected
                ? "border-dark-grey bg-light-grey-4 opacity-100"
                : dimmed
                  ? "border-light-grey-2 bg-white opacity-70 hover:border-grey"
                  : "border-light-grey-2 bg-white opacity-100 hover:border-grey"
            }`}
          >
            <svg
              viewBox="0 0 112 64"
              className="mx-auto block w-full max-w-28 text-dark-grey"
              aria-hidden="true"
            >
              <circle
                cx={leftCentre}
                cy="30"
                r={CIRCLE_RADIUS}
                fill="white"
                stroke="currentColor"
              />
              <circle
                cx={rightCentre}
                cy="30"
                r={CIRCLE_RADIUS}
                fill="#f2f2f2"
                fillOpacity="0.88"
                stroke="currentColor"
              />
              <text
                x={leftCentre - labelShift}
                y="33"
                textAnchor="middle"
                className="fill-current text-[8px]"
              >
                {question.labels.self}
              </text>
              <text
                x={rightCentre + labelShift}
                y="33"
                textAnchor="middle"
                className="fill-current text-[8px]"
              >
                {question.labels.other}
              </text>
            </svg>
            <span className="text-sub">{optionValue}</span>
          </button>
        );
      })}
    </div>

    <div className="flex justify-between text-xs text-grey">
      <span>Not connected</span>
      <span>Very connected</span>
    </div>
  </fieldset>
);

export default IosCloseness;
