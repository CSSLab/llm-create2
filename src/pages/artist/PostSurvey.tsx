
import Survey from "../../components/survey/survey";
import { useNavigate } from "react-router-dom";
import PageTemplate from "../../components/shared/pages/page";
import { useContext } from "react";
import { DataContext } from "../../App";

type QuestionType = "multiple" | "text";

interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For multiple choice
  scale?: number; // For scale questions (e.g., 7-point scale)
}

const survey: SurveyQuestion[] = [
  {
    id: "q2",
    question: "How are you feeling?",
    type: "multiple",
    options: ["Option A", "Option B", "Option C"],
  },
  { id: "q3", question: "Any additional feedback?", type: "text" },
];

const ArtistPostSurvey = () => {
  const context = useContext(DataContext);

    if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
    }

    const { userData, addPostSurvey } = context;

    const navigate = useNavigate();

        const handleSubmit = (answers: any) => {
        console.log("Survey Answers:", answers);
        addPostSurvey({postSurvey: ArtistPostSurveyQuestions, postAnswers: answers});
        navigate("/thank-you");

        alert("Survey submitted! Check console for answers.");
        };

   const filteredSurvey: SurveyDefinition = {
    ...ArtistPostSurveyQuestions,
    sections: ArtistPostSurveyQuestions.sections.filter(
      (section) =>
        !section.conditions || // no conditions → always include
        section.conditions.includes(userData?.data.condition)
    ),
  };
        

  return (
    <PageTemplate
      title="Post-survey"
      description="Please fill out the following survey before we wrap things up!"
      background="bg3"
    >
     <Survey survey={filteredSurvey} onSubmit={handleSubmit} />
    </PageTemplate>
  );
};

export default ArtistPostSurvey;
