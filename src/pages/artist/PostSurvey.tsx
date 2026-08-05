import SurveyScroll from "../../components/survey/surveyScroll";
import { useNavigate } from "react-router-dom";
import { useContext, useRef, useState } from "react";
import { DataContext } from "../../App";
import { ArtistPostSurveyQuestions } from "../../consts/surveyQuestions";
import type {
  Artist,
  SurveyAnswers,
  SurveyDefinition,
} from "../../types";
import { toaster } from "../../components/ui/toaster";
import PoemPageTemplate from "../../components/shared/pages/poemPage";
import {
  deriveArtistMetrics,
  getFinalPoemText,
} from "../../utils/artistMetrics";

const ArtistPostSurvey = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPostSurvey, sessionId, prolific, disableRefreshGuard, isTestMode } = context;

  const navigate = useNavigate();
  const submitInFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const poemData = userData?.data && (userData.data as Artist).poem;
  const submitDb = async (answers: SurveyAnswers) => {
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
      loggingSchemaVersion: poem.loggingSchemaVersion,
      passageId: poem.passageId,
      tutorialPassageId: artistData.assignment?.tutorialPassageId,
      taskPassageId:
        artistData.assignment?.taskPassageId ?? poem.passageId,
      passage: poem.passage,
      text: poem.text,
      selectedWordIndexes: poem.text,
      finalPoem: getFinalPoemText(poem),
      snapshot: poem.poemSnapshot,
      editHistory: poem.poemSnapshot,
      sparkConversation: poem.sparkConversation,
      sparkNotes: poem.sparkNotes,
      writeConversation: poem.writeConversation,
      writeNotes: poem.writeNotes,
      taskTiming: poem.taskTiming,
      llmUsage: poem.llmUsage,
      derivedMetrics: deriveArtistMetrics(poem),
    };

    // SEND IT RAHHHH
    try {
      const response = await fetch("/api/firebase/commit-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistData,
          surveyData,
          poemData,
          sessionId,
          prolific: prolific ?? null,
        }),
      });
      if (!response.ok) {
        throw new Error(`Session commit failed with status ${response.status}`);
      }

      toaster.create({
        description: "Survey successfully submitted!",
        type: "success",
        duration: 5000,
      });

      if (prolific) {
        disableRefreshGuard();
        window.location.replace(
          "https://app.prolific.com/submissions/complete?cc=CEX432JK",
        );
      } else {
        navigate("/artist/thank-you");
      }
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

  const handleSubmit = async (answers: SurveyAnswers) => {
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);
    try {
      addPostSurvey({
        postSurvey: ArtistPostSurveyQuestions,
        postAnswers: answers,
      });

      if (isTestMode) {
        try {
          const testData = {
            ...userData,
            data: {
              ...userData?.data,
              surveyResponse: {
                ...(userData?.data as Artist).surveyResponse,
                postSurvey: ArtistPostSurveyQuestions,
                postAnswers: answers,
              },
            },
          };
          await fetch("/api/firebase/autosave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, data: testData }),
          });
          toaster.create({
            description: "Test session saved (not committed to production).",
            type: "success",
            duration: 5000,
          });
          navigate("/artist/thank-you");
        } catch (error) {
          console.error("Error saving test data:", error);
          toaster.create({
            description: "There was an error saving. Please try again.",
            type: "error",
            duration: 5000,
          });
        }
      } else {
        await submitDb(answers);
      }
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const filteredSurvey: SurveyDefinition = {
    ...ArtistPostSurveyQuestions,
    sections: ArtistPostSurveyQuestions.sections.filter(
      (section) =>
        !section.conditions || // no conditions → always include
        section.conditions.includes(userData?.data.condition),
    ),
  };

  return (
    <PoemPageTemplate
      description="Please fill out the following questions before we wrap things up! (Scroll to view all questions)"
      poem={poemData}
    >
      <SurveyScroll
        survey={filteredSurvey}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </PoemPageTemplate>
  );
};

export default ArtistPostSurvey;
