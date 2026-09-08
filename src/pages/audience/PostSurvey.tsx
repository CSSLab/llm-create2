import { useNavigate } from "react-router-dom";
import { useContext, useRef, useState } from "react";
import { DataContext } from "../../App";
import { AudiencePostSurveyQuestions } from "../../consts/surveyQuestions";
import SurveyScroll from "../../components/survey/surveyScroll";
import PageTemplate from "../../components/shared/pages/audiencePages/scrollFullPage";
import { toaster } from "../../components/ui/toaster";
import type { Audience, SurveyAnswers } from "../../types";

const AudiencePostSurvey = () => {
  const navigate = useNavigate();
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, sessionId, prolific, isTestMode, flushSaves } =
    context;

  const submitDb = async (answers: SurveyAnswers) => {
    if (!userData || !userData.data) {
      console.error("userData not loaded yet!");
      return;
    }

    const audienceData = userData.data as Audience;
    const timeStamps = [...(audienceData.timeStamps ?? []), new Date()];

    // Commit the fresh answers directly. Do not queue a final autosave that
    // could recreate the incomplete record after the commit deletes it.
    const audiencePayload: Audience = {
      ...audienceData,
      timeStamps,
      surveyResponse: {
        ...audienceData.surveyResponse,
        postSurvey: AudiencePostSurveyQuestions,
        postAnswers: answers,
      },
    };

    if (isTestMode || audienceData.assignment?.preview) {
      navigate("/audience/thank-you");
      return;
    }

    try {
      // Finish queued autosaves before the commit deletes the incomplete record.
      await flushSaves();
      const response = await fetch("/api/firebase/commit-audience-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audienceData: audiencePayload,
          sessionId,
          prolific: prolific ?? undefined,
        }),
      });

      if (!response.ok) throw new Error(`Audience submission failed: ${response.status}`);

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
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (answers: SurveyAnswers) => {
    if (submittingRef.current || !userData) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    submitDb(answers);
  };

  return (
    <PageTemplate description="Please fill out the following questions before we end! (Scroll to view all questions)">
      <fieldset disabled={isSubmitting} aria-busy={isSubmitting} className="min-w-0">
        <SurveyScroll
          survey={AudiencePostSurveyQuestions}
          onSubmit={handleSubmit}
          buttonText={isSubmitting ? "Submitting…" : "Submit"}
        />
      </fieldset>
    </PageTemplate>
  );
};

export default AudiencePostSurvey;
