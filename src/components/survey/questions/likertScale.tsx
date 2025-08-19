import React from "react";
import type { LikertScaleQuestion } from "../../../types";
import { RadioGroup } from "@chakra-ui/react";

interface Props {
  question: LikertScaleQuestion;
  value: number | null | undefined; // allow undefined too
  onChange: (id: string, value: number) => void;
}

const LikertScale: React.FC<Props> = ({ question, value, onChange }) => {
  const range = Array.from(
    { length: question.scaleMax - question.scaleMin + 1 },
    (_, i) => question.scaleMin + i
  );

  return (
    <div className="mb-4 space-y-4">
      <p className="text-main">
        {" "}
        {question.question}
        <span className="text-red-700">{question.required ? "*" : ""}</span>
      </p>
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        {question.labels && (
          <span className="text-sub hidden md:block">
            {question.labels.min}
          </span>
        )}
        <RadioGroup.Root
          value={value != null ? value.toString() : ""}
          onValueChange={(e) => onChange(question.id, parseInt(e.value!, 10))}
          className="flex flex-col md:flex-row justify-between"
        >
          {range.map((num) => (
            <RadioGroup.Item
              key={num}
              value={num.toString()}
              className={`flex items-center gap-2 pb-2 md:pb-0 pl-2 cursor-pointer`}
            >
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator className="border border-light-grey-1 focus:border-grey focus:border-2 " />
              <RadioGroup.ItemText className="text-sub font-light md:hidden">
                {num === question.scaleMin
                  ? question.labels!.min
                  : num === question.scaleMax
                  ? question.labels!.max
                  : ""}
              </RadioGroup.ItemText>
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
        {question.labels && (
          <span className="text-sub hidden md:block">
            {question.labels.max}
          </span>
        )}
      </div>
    </div>
  );
};

export default LikertScale;
