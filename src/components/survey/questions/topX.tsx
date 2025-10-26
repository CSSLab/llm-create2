import React from "react";
import type { TopXRankingQuestion } from "../../../types";
import { Button } from "@chakra-ui/react";

interface Props {
  question: TopXRankingQuestion;
  value: string[]; // ordered list of selected options
  onChange: (id: string, value: string[]) => void;
}

const TopXRanking: React.FC<Props> = ({ question, value = [], onChange }) => {
  const toggleOption = (option: string) => {
    let newValue = [...value];

    if (newValue.includes(option)) {
      // Remove if already selected
      newValue = newValue.filter((v) => v !== option);
    } else {
      // Add if under maxSelectable
      if (newValue.length < question.maxSelectable) {
        newValue.push(option);
      }
    }

    onChange(question.id, newValue);
  };

  const selectedOptions = value;
  const unselectedOptions = question.options.filter(
    (opt) => !value.includes(opt)
  );

  return (
    <div className="mb-4 space-y-4">
      <div>
        <p className="text-main">
          {" "}
          {question.question}
          <span className="text-red-700">{question.required ? "*" : ""}</span>
        </p>
        <p className="text-sub">
          Select at least 1 and up to {question.maxSelectable} option
          {question.maxSelectable > 1 ? "s" : ""}.
        </p>
      </div>
      {/* Selected options */}
      {selectedOptions.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map((opt, idx) => (
              <Button
                key={opt}
                onClick={() => toggleOption(opt)}
                className="px-3 py-1 bg-grey text-white border-grey rounded text-sub"
              >
                {idx + 1}. {opt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Unselected options */}
      {unselectedOptions.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {unselectedOptions.map((opt) => (
              <Button
                key={opt}
                onClick={() => toggleOption(opt)}
                className="px-3 py-1 border border-light-grey-1 rounded text-sub"
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopXRanking;
