import React, { useState } from "react";
import type { SurveyDefinition, SurveyAnswers } from "../../types";
import QuestionRenderer from "./questionRenderer";
import { Progress, Button } from "@chakra-ui/react";
import { useRef } from "react";
import { useContext } from "react";
import { DataContext } from "../../App";

interface Props {
  survey: SurveyDefinition;
  onSubmit: (answers: SurveyAnswers) => void;
}

const Survey: React.FC<Props> = ({ survey, onSubmit }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const section = survey.sections[currentSection];

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const isSectionComplete = () => {
    return section.questions.every((q) => {
      const answer = answers[q.id];

      if (!q.required) return true; // optional question

      if (answer === undefined || answer === null) return false;

      switch (q.type) {
        case "openEnded":
          return typeof answer === "string" && answer.trim() !== "";

        case "multipleChoice":
          return answer;

        case "likertScale":
          return typeof answer === "number";

        case "topXRanking":
          return (
            Array.isArray(answer) &&
            answer.length >= 1 &&
            answer.length <= q.maxSelectable
          );

        default:
          return false; // safety fallback
      }
    });
  };

  const nextSection = () => {
    if (isSectionComplete()) {
      if (currentSection < survey.sections.length - 1) {
        setCurrentSection((s) => s + 1);
        // scroll to top
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        onSubmit(answers);
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const progress = Math.round((currentSection / survey.sections.length) * 100);

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto">
      <div className="w-full">
        <Progress.Root
          value={progress}
          className="flex flex-row mb-6 items-center space-x-2"
        >
          <Progress.Track className="w-full bg-white border border-light-grey-3">
            <Progress.Range className="bg-light-grey-1" />
          </Progress.Track>
          <Progress.ValueText className="text-sub font-base text-grey">
            {progress}%
          </Progress.ValueText>
        </Progress.Root>
      </div>
      {section.description && (
        <p className="text-sub pb-4 text-dark-grey">{section.description}</p>
      )}
      <div
        ref={containerRef}
        className="flex h-full w-full flex flex-col justify-between overflow-y-auto space-y-6"
      >
        <div className="w-full space-y-8">
          {section.questions.map((q) => (
            <QuestionRenderer
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={updateAnswer}
            />
          ))}
        </div>
        <Button
          className={`btn-primary ${
            isSectionComplete() ? "" : "opacity-40 cursor-not-allowed"
          }`}
          onClick={nextSection}
        >
          {currentSection < survey.sections.length - 1 ? "Next" : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default Survey;
