import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { DataContext } from "../../../App";
import type { SurveyAnswers } from "../../../types";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudiencePoemQuestions } from "../../../consts/surveyQuestions";
import AudiencePoemDisplay from "../../../components/audience/AudiencePoemDisplay";

import AudienceInterpretationPanel, { type InterpretationPanelHandle } from "../../../components/audience/AudienceInterpretationPanel";

const AudiencePoems = () => {
  const [currPoem, setCurrPoem] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const interpretationPanel = useRef<InterpretationPanelHandle>(null);
  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData, recordInterpretationExposure } = context;

  const audienceData = userData?.role === "audience" ? userData.data : undefined;
  const assignment = audienceData?.assignment;
  const poems = assignment?.poems ?? [];

  useEffect(() => {
    const container = document.querySelector(
      ".overflow-y-auto",
    ) as HTMLElement | null;
    const onScroll = () => {
      if (container) {
        setShowScrollTop(container.scrollTop > 100);
      } else {
        setShowScrollTop(window.scrollY > 100);
      }
    };

    if (container) {
      container.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => container.removeEventListener("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, []);

  const handleSubmit = (answers: SurveyAnswers) => {
    if (!audienceData) return;
    const surveyResponse = audienceData.surveyResponse;
    const poemId = poems[currPoem].id;
    const creativity = answers.creativity;
    if (typeof creativity !== "number" || !Number.isInteger(creativity) || creativity < 1 || creativity > 7) return;
    const isLastPoem = currPoem >= poems.length - 1;
    const exposure = interpretationPanel.current?.finish();

    addRoleSpecificData({
      surveyResponse: {
        ...surveyResponse,
        poemSurvey: AudiencePoemQuestions,
        poemAnswers: [
          ...surveyResponse.poemAnswers.filter((answer) => answer.poemId !== poemId),
          { ...answers, poemId },
        ],
        // Preserve the analysis-facing field from the former creativity step.
        creativityRatings: [
          ...surveyResponse.creativityRatings.filter((rating) => rating.poemId !== poemId),
          { poemId, rating: creativity },
        ],
        ...(exposure && { interpretationExposures: [
          ...(surveyResponse.interpretationExposures ?? []).filter((entry) => entry.poemId !== poemId),
          exposure,
        ] }),
      },
      ...(isLastPoem && {
        timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
      }),
    });

    if (!isLastPoem) {
      setCurrPoem(currPoem + 1);
      const container = document.querySelector(
        ".overflow-y-auto",
      ) as HTMLElement | null;
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    navigate("/audience/statements");
  };

  if (poems.length === 0) {
    return (
      <PageTemplate title="No poems available" description="">
        <p className="text-main">
          No poems are available right now. Please contact the study
          administrator.
        </p>
      </PageTemplate>
    );
  }

  const currentPoem = poems[currPoem];

  return (
    <PageTemplate
      title={`Read the poems (Poem ${currPoem + 1} of ${poems.length})`}
      description="Read the blackout poem carefully and share your thoughts."
      wide
    >
      <div className="mx-auto grid w-full max-w-[1024px] items-start gap-6 pb-8">
        <section
          key={currentPoem.id}
          aria-label={`Reading panel for poem ${currPoem + 1}`}
          className="sticky top-0 z-20 grid max-h-[55dvh] min-w-0 items-start gap-3 border-b border-light-grey-2 bg-white py-3 md:grid-cols-2 md:gap-10 md:py-4"
        >
          <div className="mx-auto flex max-h-[calc(35dvh-2.25rem)] w-full min-w-0 max-w-[400px] flex-col overflow-hidden md:max-h-[calc(55dvh-2rem)]" role="region" aria-label={`Blackout poem ${currPoem + 1}`}>
            <div className="min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-light-grey-2">
              <AudiencePoemDisplay
                poem={currentPoem}
                smallOnMedium
                fluid
              />
            </div>
          </div>
          <AudienceInterpretationPanel
            ref={interpretationPanel}
            poem={currentPoem}
            condition={assignment?.interpretationCondition}
            onExposure={recordInterpretationExposure}
          />
        </section>

        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <SurveyScroll
            key={`survey-${currPoem}`}
            survey={AudiencePoemQuestions}
            onSubmit={handleSubmit}
            buttonText={currPoem < poems.length - 1 ? "Next Poem" : "Continue"}
            noProgressBar
          />
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={() => {
            const container = document.querySelector(
              ".overflow-y-auto",
            ) as HTMLElement | null;
            if (container) {
              container.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="fixed bottom-6 right-6 z-50 bg-dark-grey text-sm md:text-base text-white rounded-md p-3 hover:bg-opacity-80"
          aria-label="Scroll to top"
        >
          ↑ Return to Top
        </button>
      )}
    </PageTemplate>
  );
};

export default AudiencePoems;
