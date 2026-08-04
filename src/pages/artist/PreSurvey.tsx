import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../App";
import { ArtistPreSurveyQuestions } from "../../consts/surveyQuestions";
import SurveyScroll from "../../components/survey/surveyScroll";
import FullPageTemplate from "../../components/shared/pages/fullScrollPage";
import type { SurveyAnswers } from "../../types";

const AristPreSurvey = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPreSurvey, addRoleSpecificData } = context;

  const handleSubmit = (answers: SurveyAnswers) => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/instructions");
    addPreSurvey({
      id: "artistSurvey",
      preSurvey: ArtistPreSurveyQuestions,
      preAnswers: answers,
    });
  };

  return (
    <FullPageTemplate description="Please fill out the following questions before we begin! (Scroll to view all questions)">
      <SurveyScroll survey={ArtistPreSurveyQuestions} onSubmit={handleSubmit} />
    </FullPageTemplate>
  );
};

export default AristPreSurvey;
