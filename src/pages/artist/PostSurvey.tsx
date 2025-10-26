import Survey from "../../components/survey/survey";
import { useNavigate } from "react-router-dom";
import PageTemplate from "../../components/shared/pages/page";
import { useContext } from "react";
import { DataContext } from "../../App";
import { ArtistPostSurveyQuestions } from "../../consts/surveyQuestions";
import type { SurveyDefinition, Artist } from "../../types";
import { db } from "../../firebase";
import { doc, collection, writeBatch } from "firebase/firestore";
import { toaster } from "../../components/ui/toaster";

const ArtistPostSurvey = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPostSurvey } = context;

  const navigate = useNavigate();
  const submitDb = async (answers: any) => {
    // Add to DB
    const artistRef = doc(collection(db, "artist"));
    const surveyRef = doc(collection(db, "artistSurvey"));
    const poemRef = doc(collection(db, "poem"));

    const artist = {
      condition: userData?.data.condition,
      surveyResponse: surveyRef,
      poem: poemRef,
      timestamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    };

    const artistData = userData?.data as Artist;

    const survey = artistData.surveyResponse;

    const surveyData = {
      artistId: artistRef.id,
      preSurvey: survey.preSurvey,
      preSurveyAnswers: survey.preAnswers,
      postSurvey: ArtistPostSurveyQuestions,
      postSurveyAnswers: answers,
    };

    const poem = artistData.poem;

    const poemData = {
      artistId: artistRef.id,
      text: poem.text,
      sparkConversation: poem.sparkConversation,
      sparkNotes: poem.sparkNotes,
      writeConversation: poem.writeConversation,
      writeNotes: poem.writeNotes,
    };

    const batch = writeBatch(db);
    batch.set(artistRef, artist);
    batch.set(surveyRef, surveyData);
    batch.set(poemRef, poemData);

    try {
      await batch.commit();
      toaster.create({
        description: "Survey successfully submitted!",
        type: "success",
        duration: 5000,
      });
      navigate("/thank-you");
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
