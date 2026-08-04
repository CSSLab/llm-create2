import React from "react";
import type { OpenEndedQuestion } from "../../../types";
import { Textarea } from "@chakra-ui/react";

interface Props {
  question: OpenEndedQuestion;
  value: string;
  onChange: (id: string, value: string) => void;
}

const OpenEnded: React.FC<Props> = ({ question, value, onChange }) => {
  const wordCount = (value || "").trim()
    ? (value || "").trim().split(/\s+/).length
    : 0;

  return (
    <div className="mb-4 space-y-4">
      <p className="text-main">
        {" "}
        {question.question}
        <span className="text-red-700">{question.required ? "*" : ""}</span>
      </p>

      <Textarea
        placeholder={question.placeholder || "Your answer..."}
        className="border border-light-grey-1 p-2 text-base focus:border-grey h-24"
        value={value || ""}
        onChange={(e) => onChange(question.id, e.target.value)}
        size="sm"
      />
      {question.softWordTarget ? (
        <p
          className={`text-xs ${
            wordCount > question.softWordTarget.max ? "text-amber-700" : "text-grey"
          }`}
        >
          {wordCount} words · suggested length {question.softWordTarget.min}–
          {question.softWordTarget.max} words
        </p>
      ) : null}
    </div>
  );
};

export default OpenEnded;
