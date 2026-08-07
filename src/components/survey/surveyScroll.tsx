import React, { useState, useContext, useMemo } from "react";
import type { SurveyDefinition, SurveyAnswers } from "../../types";
import QuestionRenderer from "./questionRenderer";
import { Progress, Button } from "@chakra-ui/react";
import { DataContext } from "../../App";
import { toaster } from "../../components/ui/toaster";

interface Props {
  survey: SurveyDefinition;
  noProgressBar?: boolean;
  buttonText?: string;
  onSubmit: (answers: SurveyAnswers) => void;
}

const SurveyScroll: React.FC<Props> = ({
  survey,
  noProgressBar,
  onSubmit,
  buttonText,
}) => {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const allQuestions = useMemo(
    () => survey.sections.flatMap((section) => section.questions),
    [survey.sections]
  );

  const requiredQuestions = allQuestions.filter((q) => q.required);

  const isQuestionAnswered = (q: any) => {
    const answer = answers[q.id];
    if (answer === undefined || answer === null) return false;

    switch (q.type) {
      case "openEnded":
        return typeof answer === "string" && answer.trim() !== "";
      case "multipleChoice":
        return !!answer;
      case "likertScale":
        return typeof answer === "number";
      case "range":
        return answer;
      case "circularChoice":
        return answer;
      case "dragRank":
        return Array.isArray(answer) && answer.length === q.items.length;
      case "selectAll":
        return Array.isArray(answer) && answer.length > 0;
      case "topXRanking":
        return (
          Array.isArray(answer) &&
          answer.length >= 1 &&
          answer.length <= q.maxSelectable
        );
      case "emotionWheel":
        return typeof answer === "object" && !!(answer as any).emotion;
      case "iosCloseness":
        return typeof answer === "number";
      default:
        return false;
    }
  };

  const answeredCount = requiredQuestions.filter(isQuestionAnswered).length;
  const progress = Math.round((answeredCount / requiredQuestions.length) * 100);

  const isSurveyComplete = answeredCount === requiredQuestions.length;

  const handleSubmit = () => {
    if (isSurveyComplete) {
      onSubmit(answers);
    } else {
      toaster.create({
        description: "Please fill out all required questions!",
        type: "error",
        duration: 5000,
      });
    }
  };

  return (
    <div className="h-full w-full flex flex-col py-4">
      {/* Progress Bar */}
      {!noProgressBar && (
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
      )}

      {/* Sections */}
      <div className="w-full h-100vh space-y-10 overflow-y-scroll">
        {survey.sections.map((section, index) => (
          <div key={index} className="space-y-6 border-b pb-8">
            {section.title && (
              <p className="text-h2 font-serif text-dark-grey">
                {section.title}
              </p>
            )}
            {section.description && (
              <p className="text-sub text-dark-grey">{section.description}</p>
            )}
            <div className="space-y-4">
              {section.questions.map((q) => (
                <QuestionRenderer
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={updateAnswer}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div className="w-full place-content-center flex">
          <Button
            className={`btn-primary mt-8 ${
              isSurveyComplete ? "" : "opacity-40 cursor-not-allowed"
            }`}
            onClick={handleSubmit}
          >
            {buttonText || "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SurveyScroll;
