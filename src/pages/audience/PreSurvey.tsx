import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../../components/shared/pages/halfPage";
import { useContext } from "react";
import { DataContext } from "../../App";
import type { SurveyDefinition } from "../../types";
import Survey from "../../components/survey/survey";

//UPDATE
export const sampleSurvey: SurveyDefinition = {
  id: "survey1",
  title: "Customer Feedback Survey",
  sections: [
    {
      id: "section1",
      title: "Basic Info",
      questions: [
        {
          id: "q1",
          type: "multipleChoice",
          question: "What is your favorite product?",
          options: ["Product A", "Product B", "Product C"],
          required: true,
        },
        {
          id: "q2",
          type: "openEnded",
          question: "Why do you like this product?",
          placeholder: "Type your answer here...",
          required: true,
        },
      ],
    },
    {
      id: "section2",
      title: "Preferences",
      questions: [
        {
          id: "q3",
          type: "topXRanking",
          question: "Select and rank your top 3 favorite colors",
          options: ["Red", "Blue", "Green", "Yellow", "Purple"],
          maxSelectable: 3,
          required: true,
        },
        {
          id: "q4",
          type: "likertScale",
          question: "How satisfied are you with our service?",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Not satisfied", max: "Very satisfied" },
          required: true,
        },
      ],
    },
  ],
};

const AudiencePreSurvey = () => {
  //   const [answers, ...] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const handleSubmit = (answers: any) => {
    console.log(answers);
    navigate("/artist/instructions");
  };

  return (
    <HalfPageTemplate
      title="Pre-survey"
      description="Please fill out the following survey before we begin!"
      background="bg5"
    >
      <Survey survey={sampleSurvey} onSubmit={handleSubmit} />
    </HalfPageTemplate>
  );
};

export default AudiencePreSurvey;
