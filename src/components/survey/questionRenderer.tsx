import React from "react";
import type { Question } from "../../types";
import MultipleChoice from "./questions/multipleChoice";
import OpenEnded from "./questions/openEnded";
import LikertScale from "./questions/likertScale";
import TopXRanking from "./questions/topX";

interface Props {
  question: Question;
  value: any;
  onChange: (questionId: string, value: any) => void;
}

const QuestionRenderer: React.FC<Props> = ({ question, value, onChange }) => {
  switch (question.type) {
    case "multipleChoice":
      return (
        <MultipleChoice question={question} value={value} onChange={onChange} />
      );
    case "openEnded":
      return (
        <OpenEnded question={question} value={value} onChange={onChange} />
      );
    case "likertScale":
      return (
        <LikertScale question={question} value={value} onChange={onChange} />
      );
    case "topXRanking":
      return (
        <TopXRanking
          question={question}
          value={value || []}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
};

export default QuestionRenderer;
