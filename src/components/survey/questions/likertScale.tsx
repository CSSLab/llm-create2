import React from "react";
import type { LikertScaleQuestion } from "../../../types";
import { RadioGroup } from "@chakra-ui/react";

interface Props {
  question: LikertScaleQuestion;
  value: number | null | undefined;
  onChange: (id: string, value: number) => void;
}

const LikertScale: React.FC<Props> = ({ question, value, onChange }) => {
  const colCount = question.options.length + (question.sideTitle ? 1 : 0);
  const gridStyle = {
    gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
  };

  // horizontal layout: always shown (doNotCollapse) or only on md+
  const horizontalLayout = (
    <div className={question.doNotCollapse ? "block" : "hidden md:block"}>
      {/* Labels row — full text, no clipping */}
      {!question.removeValues && (
        <div className="grid mb-3" style={gridStyle}>
          {/* Empty placeholder to keep label columns aligned under their radios */}
          {question.sideTitle && <div />}
          {question.options.map((opt) => (
            <span
              key={opt.value}
              className="text-sub text-center break-words leading-tight px-1"
            >
              {opt.label}
            </span>
          ))}
        </div>
      )}

      {/* Radio buttons row — all on the same baseline */}
      <div className="grid" style={gridStyle}>
        {question.sideTitle && (
          <div className="pr-2 flex items-center text-sub">
            {question.question}
            <span className="text-red-700">{question.required ? "*" : ""}</span>
          </div>
        )}
        {question.options.map((opt) => (
          <div key={opt.value} className="flex justify-center">
            <RadioGroup.Item
              value={opt.value.toString()}
              className="cursor-pointer"
              aria-label={opt.label}
            >
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator className="border border-light-grey-1 rounded-full w-4 h-4 focus:border-grey focus:border-2 hover:cursor-pointer" />
            </RadioGroup.Item>
          </div>
        ))}
      </div>
    </div>
  );

  // vertical layout: one option per row, label beside radio
  const verticalLayout = (
    <div className={`flex flex-col gap-3 ${question.doNotCollapse ? "hidden" : "md:hidden"}`}>
      {question.options.map((opt) => (
        <div key={opt.value} className="flex items-center gap-3">
          <RadioGroup.Item
            value={opt.value.toString()}
            className="cursor-pointer flex-shrink-0"
            aria-label={opt.label}
          >
            <RadioGroup.ItemHiddenInput />
            <RadioGroup.ItemIndicator className="border border-light-grey-1 rounded-full w-4 h-4 focus:border-grey focus:border-2 hover:cursor-pointer" />
          </RadioGroup.Item>
          <span className="text-sub break-words">{opt.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mb-4 space-y-4">
      <p className={`text-main` + (question.sideTitle ? " block md:hidden" : "")}>
        {question.question}
        <span className="text-red-700">{question.required ? "*" : ""}</span>
      </p>

      <RadioGroup.Root
        value={value != null ? value.toString() : ""}
        onValueChange={(e) => onChange(question.id, parseInt(e.value!, 10))}
        className="w-full"
        aria-label={question.question}
      >
        {horizontalLayout}
        {verticalLayout}
      </RadioGroup.Root>
    </div>
  );
};

export default LikertScale;
