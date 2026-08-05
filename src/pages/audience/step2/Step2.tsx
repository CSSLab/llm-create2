import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../../App";
import AudiencePoem from "../../../components/audience/AudiencePoem";
import FullPageTemplate from "../../../components/shared/pages/fullScrollPage";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudiencePoemQuestions } from "../../../consts/surveyQuestions";
import type { Audience, SurveyAnswers } from "../../../types";

const AudiencePoems = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;
  const navigate = useNavigate();
  const [poemIndex, setPoemIndex] = useState(0);
  const audienceData = userData?.data as Audience;
  const poems = audienceData.assignment.poems;
  const currentPoem = poems[poemIndex];

  const handleSubmit = (answers: SurveyAnswers) => {
    const isLastPoem = poemIndex === poems.length - 1;
    addRoleSpecificData({
      surveyResponse: {
        ...audienceData.surveyResponse,
        poemSurvey: AudiencePoemQuestions,
        poemAnswers: [
          ...audienceData.surveyResponse.poemAnswers,
          { poemId: currentPoem.id, ...answers },
        ],
      },
      ...(isLastPoem
        ? { timeStamps: [...audienceData.timeStamps, new Date()] }
        : {}),
    });

    if (isLastPoem) {
      navigate("/audience/statements");
    } else {
      setPoemIndex((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <FullPageTemplate
      title={`Read poem ${poemIndex + 1} of ${poems.length}`}
      description="Take your time with the poem, then answer the questions in order. You will not see its source text yet."
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 py-4 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(30rem,1.1fr)] lg:items-start">
        <div className="lg:sticky lg:top-4">
          <AudiencePoem poem={currentPoem} label={`Poem ${poemIndex + 1}`} />
        </div>
        <SurveyScroll
          key={currentPoem.id}
          survey={AudiencePoemQuestions}
          onSubmit={handleSubmit}
          buttonText={poemIndex === poems.length - 1 ? "Continue" : "Next poem"}
          noProgressBar
        />
      </div>
    </FullPageTemplate>
  );
};

export default AudiencePoems;
