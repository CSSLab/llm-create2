import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../App";
import { AudiencePostSurveyQuestions } from "../../consts/surveyQuestions";
import SurveyScroll from "../../components/survey/surveyScroll";
import PageTemplate from "../../components/shared/pages/audiencePages/scrollFullPage";
import { toaster } from "../../components/ui/toaster";
import type { Audience } from "../../types";

const AudiencePostSurvey = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPostSurvey, addRoleSpecificData, sessionId, prolific, isTestMode } =
    context;

  const submitDb = async (answers: any) => {
    if (!userData || !userData.data) {
      console.error("userData not loaded yet!");
      return;
    }

    const audienceData = userData.data as Audience;
    const timeStamps = [...(audienceData.timeStamps ?? []), new Date()];

    // Build the payload directly from fresh values rather than relying on
    // userData, since the addPostSurvey call below hasn't landed in state yet.
    const audiencePayload: Audience = {
      ...audienceData,
      timeStamps,
      surveyResponse: {
        ...audienceData.surveyResponse,
        postSurvey: AudiencePostSurveyQuestions,
        postAnswers: answers,
      },
    };

    if (isTestMode) {
      navigate("/audience/thank-you");
      return;
    }

    try {
      await fetch("/api/firebase/commit-audience-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audienceData: audiencePayload,
          sessionId,
          prolific: prolific ?? undefined,
        }),
      });

      toaster.create({
        description: "Survey successfully submitted!",
        type: "success",
        duration: 5000,
      });

      navigate("/audience/thank-you");
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

  const handleSubmit = (answers: any) => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    addPostSurvey({
      postSurvey: AudiencePostSurveyQuestions,
      postAnswers: answers,
    });
    submitDb(answers);
  };

  return (
    <PageTemplate description="Please fill out the following questions before we end! (Scroll to view all questions)">
      <SurveyScroll
        survey={AudiencePostSurveyQuestions}
        onSubmit={handleSubmit}
      />
    </PageTemplate>
  );
};

export default AudiencePostSurvey;
