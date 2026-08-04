import React from "react";
import type { AnswerValue, EmotionWheelAnswer, Question } from "../../types";
import MultipleChoice from "./questions/multipleChoice";
import OpenEnded from "./questions/openEnded";
import LikertScale from "./questions/likertScale";
import TopXRanking from "./questions/topX";
import CircularMultipleChoice from "./questions/circularMultipleChoice";
import Range from "./questions/range";
import EmotionWheel from "./questions/emotionWheel";

interface Props {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (questionId: string, value: AnswerValue) => void;
}

const QuestionRenderer: React.FC<Props> = ({ question, value, onChange }) => {
  switch (question.type) {
    case "multipleChoice":
      return (
        <MultipleChoice
          question={question}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );
    case "openEnded":
      return (
        <OpenEnded
          question={question}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );
    case "likertScale":
      return (
        <LikertScale
          question={question}
          value={typeof value === "number" ? value : undefined}
          onChange={onChange}
        />
      );
    case "range":
      return (
        <Range
          question={question}
          value={typeof value === "number" ? value : undefined}
          onChange={onChange}
        />
      );
    case "circularChoice":
      return (
        <CircularMultipleChoice
          question={question}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );
    case "emotionWheel":
      return (
        <EmotionWheel
          question={question}
          value={value as EmotionWheelAnswer | undefined}
          onChange={onChange}
        />
      );
    case "topXRanking":
      return (
        <TopXRanking
          question={question}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
};

export default QuestionRenderer;
