import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../../components/shared/pages/halfPage";
import { useContext } from "react";
import { DataContext } from "../../App";
import { ArtistPreSurveyQuestions } from "../../consts/surveyQuestions";
import Survey from "../../components/survey/survey";
import type { ArtistSurvey, SurveyQuestion } from "../../types";

// const survey: SurveyQuestion[] = [
//   {
//     id: "q1",
//     question: "How are you feeling?",
//     type: "multiple",
//     options: ["Option A", "Option B", "Option C"],
//   },
//   { id: "q2", question: "Any additional feedback?", type: "text" },
// ];

const AristPreSurvey = () => {
  const navigate = useNavigate();
    const context = useContext(DataContext);
      if (!context) {
        throw new Error("Component must be used within a DataContext.Provider");
      }

      const { addPreSurvey } = context;
    if (!context) {
        throw new Error("Component must be used within a DataContext.Provider");
    }
    const handleSubmit = (answers: any) => {
    console.log("Survey Answers:", answers);
    navigate("/artist/instructions");
    addPreSurvey({id: "artistSurvey", preSurvey: ArtistPreSurveyQuestions, preAnswers: answers});

    alert("Survey submitted! Check console for answers.");
  };


  return (
    <HalfPageTemplate
      title="Pre-survey"
      description="Please fill out the following survey before we begin!"
      background="bg5"
    >
        <Survey survey={ArtistPreSurveyQuestions} onSubmit={handleSubmit} />
    </HalfPageTemplate>
  );
};

export default AristPreSurvey;
