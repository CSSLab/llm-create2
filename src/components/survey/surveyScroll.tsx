import React, { useState, useContext, useMemo, useRef } from "react";
import type {
  AnswerValue,
  Question,
  SurveyDefinition,
  SurveyAnswers,
} from "../../types";
import QuestionRenderer from "./questionRenderer";
import { Progress, Button } from "@chakra-ui/react";
import { DataContext } from "../../App";
import { toaster } from "../../components/ui/toaster";

interface Props {
  survey: SurveyDefinition;
  onSubmit: (answers: SurveyAnswers) => void | boolean | Promise<void | boolean>;
  isSubmitting?: boolean;
}

const SurveyScroll: React.FC<Props> = ({
  survey,
  onSubmit,
  isSubmitting = false,
}) => {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const submitCalledRef = useRef(false);
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const updateAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const allQuestions = useMemo(
    () => survey.sections.flatMap((section) => section.questions),
    [survey.sections],
  );

  const isQuestionVisible = (q: (typeof allQuestions)[number]) =>
    !q.showWhen || answers[q.showWhen.questionId] === q.showWhen.equals;

  const visibleQuestions = allQuestions.filter(isQuestionVisible);
  const requiredQuestions = visibleQuestions.filter((q) => q.required);

  const isQuestionAnswered = (q: Question) => {
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
      case "emotionWheel":
        return (
          typeof answer === "object" &&
          answer !== null &&
          !Array.isArray(answer) &&
          typeof answer.emotion === "string" &&
          typeof answer.intensity === "number" &&
          answer.intensity >= 0 &&
          answer.intensity <= 5
        );
      case "topXRanking":
        return (
          Array.isArray(answer) &&
          answer.length >= 1 &&
          answer.length <= q.maxSelectable
        );
      default:
        return false;
    }
  };

  const answeredCount = requiredQuestions.filter(isQuestionAnswered).length;
  const progress = requiredQuestions.length
    ? Math.round((answeredCount / requiredQuestions.length) * 100)
    : 100;

  const isSurveyComplete = answeredCount === requiredQuestions.length;

  const handleSubmit = async () => {
    if (isSubmitting || submitCalledRef.current) return;
    submitCalledRef.current = true;
    if (isSurveyComplete) {
      const visibleAnswers = visibleQuestions.reduce<SurveyAnswers>(
        (result, question) => {
          const answer = answers[question.id];
          if (answer !== undefined) result[question.id] = answer;
          return result;
        },
        {},
      );
      try {
        const submitted = await onSubmit(visibleAnswers);
        if (submitted === false) submitCalledRef.current = false;
      } catch (error) {
        submitCalledRef.current = false;
        throw error;
      }
    } else {
      submitCalledRef.current = false;
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

      {/* Sections */}
      <div className="w-full h-100vh space-y-10 overflow-y-scroll">
        {survey.sections.map((section) => (
          <div key={section.id} className="space-y-6 border-b pb-8">
            <h2 className="text-h2">{section.title}</h2>
            {section.description && (
              <p className="text-sub text-dark-grey">{section.description}</p>
            )}
            <div className="space-y-6">
              {section.questions.map((q) =>
                isQuestionVisible(q) ? (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    value={answers[q.id]}
                    onChange={updateAnswer}
                  />
                ) : null,
              )}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div className="w-full flex justify-center">
          <Button
            className={`btn-primary self-center mt-8 ${
              isSurveyComplete && !isSubmitting ? "" : "opacity-40 cursor-not-allowed"
            }`}
            disabled={!isSurveyComplete || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SurveyScroll;
