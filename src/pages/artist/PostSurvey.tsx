import SurveyScroll from "../../components/survey/surveyScroll";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../App";
import { ArtistPostSurveyQuestions } from "../../consts/surveyQuestions";
import type { SurveyDefinition, Artist } from "../../types";
import { toaster } from "../../components/ui/toaster";
import PoemPageTemplate from "../../components/shared/pages/poemPage";

const ArtistPostSurvey = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPostSurvey, sessionId } = context;

  const navigate = useNavigate();
  const poemData = userData?.data && (userData.data as Artist).poem;
  const submitDb = async (answers: any) => {
    // format the data
    if (!userData || !userData.data) {
      console.error("userData not loaded yet!");
      return;
    }

    const artistData = userData?.data as Artist;
    const survey = artistData.surveyResponse;
    const poem = artistData.poem;

    const surveyData = {
      preSurvey: survey.preSurvey,
      preSurveyAnswers: survey.preAnswers,
      postSurvey: ArtistPostSurveyQuestions,
      postSurveyAnswers: answers,
    };

    const poemData = {
      passageId: poem.passageId,
      text: poem.text,
      snapshot: poem.poemSnapshot,
      sparkConversation: poem.sparkConversation,
      sparkNotes: poem.sparkNotes,
      writeConversation: poem.writeConversation,
      writeNotes: poem.writeNotes,
    };

    // SEND IT RAHHHH
    try {
      await fetch("/api/firebase/artist/commit-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistData,
          surveyData,
          poemData,
          sessionId,
        }),
      });

      toaster.create({
        description: "Survey successfully submitted!",
        type: "success",
        duration: 5000,
      });
      navigate("/artist/thank-you");
    } catch (error) {
      console.error("Error saving data:", error);
      toaster.create({
        description:
          "There was an error submitting your survey. Please try again.",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleSubmit = async (answers: any) => {
    addPostSurvey({
      postSurvey: ArtistPostSurveyQuestions,
      postAnswers: answers,
    });
    submitDb(answers);
  };

  const filteredSurvey: SurveyDefinition = {
    ...ArtistPostSurveyQuestions,
    sections: ArtistPostSurveyQuestions.sections.filter(
      (section) =>
        !section.conditions || // no conditions → always include
        section.conditions.includes((userData as any)?.data?.condition)
    ),
  };

  return (
    <PoemPageTemplate
      description="Please fill out the following questions before we wrap things up! (Scroll to view all questions)"
      poem={poemData}
    >
      <SurveyScroll survey={filteredSurvey} onSubmit={handleSubmit} />
    </PoemPageTemplate>
  );
};

export default ArtistPostSurvey;
