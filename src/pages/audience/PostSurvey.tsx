import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../App";
import FullPageTemplate from "../../components/shared/pages/fullScrollPage";
import SurveyScroll from "../../components/survey/surveyScroll";
import { toaster } from "../../components/ui/toaster";
import { AudiencePostSurveyQuestions } from "../../consts/surveyQuestions";
import type { Audience, SurveyAnswers } from "../../types";

const AudiencePostSurvey = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const {
    userData,
    addPostSurvey,
    sessionId,
    prolific,
    disableRefreshGuard,
    isTestMode,
  } = context;
  const navigate = useNavigate();
  const submitInFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (answers: SurveyAnswers) => {
    if (submitInFlightRef.current || !userData) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);

    const audienceData = userData.data as Audience;
    const completedAudienceData: Audience = {
      ...audienceData,
      timeStamps: [...audienceData.timeStamps, new Date()],
      surveyResponse: {
        ...audienceData.surveyResponse,
        postSurvey: AudiencePostSurveyQuestions,
        postAnswers: answers,
      },
    };

    if (isTestMode) {
      addPostSurvey({
        postSurvey: AudiencePostSurveyQuestions,
        postAnswers: answers,
      });
      navigate("/audience/thank-you");
      return;
    }

    try {
      const response = await fetch("/api/firebase/commit-audience-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audienceData: completedAudienceData,
          sessionId,
          prolific,
        }),
      });
      if (!response.ok) {
        throw new Error(`Audience submission failed with status ${response.status}`);
      }

      if (prolific) {
        disableRefreshGuard();
        window.location.replace(
          "https://app.prolific.com/submissions/complete?cc=CEX432JK",
        );
      } else {
        navigate("/audience/thank-you");
      }
    } catch (error) {
      console.error("Audience submission failed", error);
      toaster.create({
        description:
          "There was an error submitting your responses. Please try again.",
        type: "error",
        duration: 5000,
      });
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <FullPageTemplate
      title="A few final questions"
      description="These background questions appear last so they do not influence your responses to the poems."
    >
      <div className="mx-auto w-full max-w-3xl py-4">
        <SurveyScroll
          survey={AudiencePostSurveyQuestions}
          onSubmit={(answers) => void handleSubmit(answers)}
          isSubmitting={isSubmitting}
          buttonText="Submit responses"
        />
      </div>
    </FullPageTemplate>
  );
};

export default AudiencePostSurvey;
