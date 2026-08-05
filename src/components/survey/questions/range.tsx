import React from "react";
import { Slider } from "@chakra-ui/react";
import type { RangeQuestion } from "../../../types";

interface Props {
  question: RangeQuestion;
  value: number | undefined;
  onChange: (id: string, value: number) => void;
}

const Range: React.FC<Props> = ({ question, value, onChange }) => {
  return (
    <div className="mb-6 w-full flex flex-col">
      <span className="text-main mb-4">
        {question.question}
        {question.required && <span className="text-red-700">*</span>}
      </span>

      <div className="w-full flex flex-col items-center">
        <Slider.Root
          value={[value ?? 50]}
          min={0}
          max={100}
          step={1}
          onValueChange={(e) => onChange(question.id, e.value[0]!)}
          className="relative w-full h-6"
        >
          <Slider.Label className="sr-only">{question.question}</Slider.Label>

          <Slider.Control className="w-full h-2">
            <Slider.Track className="bg-white border border-light-grey-3">
              <Slider.Range className="bg-grey" />
            </Slider.Track>

            <Slider.Thumb
              index={0}
              className="w-3 h-3 bg-grey rounded-full flex items-center justify-center"
            >
              <Slider.HiddenInput />
            </Slider.Thumb>
          </Slider.Control>
        </Slider.Root>

        <span className="mt-2 text-sm font-medium text-dark-grey" aria-live="polite">
          {value === undefined ? "Choose a value" : `${value}%`}
        </span>

        <div className="flex justify-between w-full mt-2">
          <span className="text-sub font-light text-sm">
            {question.labels.min}
          </span>
          <span className="text-sub font-light text-sm">
            {question.labels.max}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Range;
