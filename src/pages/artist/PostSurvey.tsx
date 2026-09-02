import SurveyScroll from "../../components/survey/surveyScroll";
import { useNavigate } from "react-router-dom";
import { useContext, useRef, useState } from "react";
import { DataContext } from "../../App";
import { ArtistPostSurveyQuestions } from "../../consts/surveyQuestions";
import type { Artist, SurveyAnswers } from "../../types";
import { toaster } from "../../components/ui/toaster";
import PoemPageTemplate from "../../components/shared/pages/poemPage";
import {
  deriveArtistMetrics,
  getFinalPoemText,
} from "../../utils/artistMetrics";
import { Passages } from "../../consts/passages";
import {
  createEmptyPoem,
  getArtistPostSurveyForPoem,
  getPassageForPoem,
  TOTAL_ARTIST_POEMS,
} from "../../utils/artistRounds";

const ArtistPostSurvey = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const {
    userData,
    addPostSurvey,
    addRoleSpecificData,
    sessionId,
    prolific,
    disableRefreshGuard,
    isTestMode,
  } = context;

  const navigate = useNavigate();
  const submitInFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const artistData = userData?.data as Artist;
  const poemData = artistData?.poem;
  const poemNumber = artistData?.poemNumber ?? 1;
  const totalPoems = artistData?.totalPoems ?? TOTAL_ARTIST_POEMS;
  const isFinalPoem = poemNumber === totalPoems;

  const surveyForThisPoem = getArtistPostSurveyForPoem(
    ArtistPostSurveyQuestions,
    poemNumber,
    totalPoems,
    artistData.condition,
  );

  const saveProductionPoem = async (answers: SurveyAnswers) => {
    if (!userData || !artistData || !poemData) {
      console.error("userData not loaded yet!");
      return false;
    }

    const survey = artistData.surveyResponse;
    const surveyData = {
      preSurvey: survey.preSurvey,
      preSurveyAnswers: survey.preAnswers,
      postSurvey: surveyForThisPoem,
      postSurveyAnswers: answers,
      poemNumber,
      totalPoems,
    };

    const savedPoemData = {
      loggingSchemaVersion: poemData.loggingSchemaVersion,
      passageId: poemData.passageId,
      tutorialPassageId: artistData.assignment?.tutorialPassageId,
      taskPassageId:
        artistData.assignment?.taskPassageId ?? poemData.passageId,
      passage: poemData.passage,
      text: poemData.text,
      selectedWordIndexes: poemData.text,
      finalPoem: getFinalPoemText(poemData),
      snapshot: poemData.poemSnapshot,
      editHistory: poemData.poemSnapshot,
      sparkConversation: poemData.sparkConversation,
      sparkNotes: poemData.sparkNotes,
      writeConversation: poemData.writeConversation,
      writeNotes: poemData.writeNotes,
      taskTiming: poemData.taskTiming,
      llmUsage: poemData.llmUsage,
      derivedMetrics: deriveArtistMetrics(poemData),
      poemNumber,
      totalPoems,
    };

    try {
      const response = await fetch("/api/firebase/commit-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistData,
          surveyData,
          poemData: savedPoemData,
          sessionId,
          prolific: prolific ?? null,
          poemNumber,
          totalPoems,
          isFinalPoem,
        }),
      });
      if (!response.ok) {
        throw new Error(`Session commit failed with status ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      toaster.create({
        description: "There was an error submitting your survey. Please try again.",
        type: "error",
        duration: 5000,
      });
      return false;
    }
  };

  const saveTestPoem = async (answers: SurveyAnswers) => {
    try {
      const testData = {
        ...userData,
        data: {
          ...artistData,
          surveyResponse: {
            ...artistData.surveyResponse,
            postSurvey: surveyForThisPoem,
            postAnswers: answers,
          },
        },
      };
      const response = await fetch("/api/firebase/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, data: testData }),
      });
      if (!response.ok) {
        throw new Error(`Autosave failed with status ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error("Error saving test data:", error);
      toaster.create({
        description: "There was an error saving. Please try again.",
        type: "error",
        duration: 5000,
      });
      return false;
    }
  };

  const continueAfterSave = () => {
    if (isFinalPoem) {
      if (prolific && !isTestMode) {
        disableRefreshGuard();
        window.location.replace(
          "https://app.prolific.com/submissions/complete?cc=CEX432JK",
        );
      } else {
        navigate("/artist/thank-you");
      }
      return;
    }

    const nextPoemNumber = poemNumber + 1;
    const passageIds = artistData.assignment?.passageIds ?? [];
    const nextPassage = getPassageForPoem(
      Passages,
      passageIds,
      nextPoemNumber,
    );

    addRoleSpecificData({
      poem: createEmptyPoem(nextPassage),
      poemNumber: nextPoemNumber,
      surveyResponse: {
        ...artistData.surveyResponse,
        postSurvey: ArtistPostSurveyQuestions,
        postAnswers: {},
      },
    });
    navigate("/artist/brainstorm");
  };

  const handleSubmit = async (answers: SurveyAnswers) => {
    if (submitInFlightRef.current) return false;
    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      addPostSurvey({
        postSurvey: surveyForThisPoem,
        postAnswers: answers,
      });

      const saved = isTestMode
        ? await saveTestPoem(answers)
        : await saveProductionPoem(answers);
      if (!saved) return false;

      toaster.create({
        description: isFinalPoem
          ? "All three poems and surveys were successfully submitted!"
          : `Poem ${poemNumber} of ${totalPoems} was saved. Next: poem ${poemNumber + 1}.`,
        type: "success",
        duration: 5000,
      });
      continueAfterSave();
      return true;
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <PoemPageTemplate
      description={`Poem ${poemNumber} of ${totalPoems}: please answer about the poem shown here.${
        isFinalPoem
          ? " The last sections ask about your overall experience."
          : ""
      } (Scroll to view all questions)`}
      poem={poemData}
    >
      <SurveyScroll
        survey={surveyForThisPoem}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </PoemPageTemplate>
  );
};

export default ArtistPostSurvey;
