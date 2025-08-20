import React from "react";
import type { MultipleChoiceQuestion } from "../../../types";
import { RadioGroup } from "@chakra-ui/react";

interface Props {
  question: MultipleChoiceQuestion;
  value: string;
  onChange: (id: string, value: string) => void;
}

const MultipleChoice: React.FC<Props> = ({ question, value, onChange }) => {
  return (
    <div className="mb-4 w-full flex flex-col space-y-4">
      <p className="text-main">
        {" "}
        {question.question}
        <span className="text-red-700">{question.required ? "*" : ""}</span>
      </p>
      <RadioGroup.Root
        value={value}
        onValueChange={(e) => onChange(question.id, e.value!)}
        className="flex flex-col gap-4 font-light"
      >
        {question.options.map((opt) => (
          <RadioGroup.Item
            key={opt}
            value={opt}
            className="flex items-center gap-2 cursor-pointer"
          >
            <RadioGroup.ItemHiddenInput />
            <RadioGroup.ItemIndicator className="border border-light-grey-1 focus:border-grey focus:border-2" />
            <RadioGroup.ItemText className="text-sub font-light">
              {opt}
            </RadioGroup.ItemText>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
};

export default MultipleChoice;
