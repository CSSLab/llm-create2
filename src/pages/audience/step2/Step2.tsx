import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import type { AudienceAssignment, SurveyAnswers } from "../../../types";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudiencePoemQuestions } from "../../../consts/surveyQuestions";
import AudiencePoemDisplay from "../../../components/audience/AudiencePoemDisplay";

const AudiencePoems = () => {
  const [currPoem, setCurrPoem] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;

  const assignment = (userData?.data as any)?.assignment as
    | AudienceAssignment
    | undefined;
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
    const surveyResponse = ((userData?.data as any)?.surveyResponse ??
      {}) as any;
    const isLastPoem = currPoem >= poems.length - 1;

    addRoleSpecificData({
      surveyResponse: {
        ...surveyResponse,
        poemSurvey: AudiencePoemQuestions,
        poemAnswers: [
          ...(surveyResponse.poemAnswers ?? []),
          { poemId: poems[currPoem].id, ...answers },
        ],
      },
      ...(isLastPoem && {
        timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
      }),
    } as any);

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
      description="Take your time to read and reflect on each poem, then answer the questions below."
    >
      <div className="flex flex-col md:grid md:[grid-template-columns:1fr_1fr] gap-6 py-4 md:py-8 md:items-start">
        {/* Poem — left on desktop, top on mobile. Sticky: stays in place as the page scrolls. */}
        <div className="md:sticky md:top-4 flex justify-center">
          <AudiencePoemDisplay poem={currentPoem} smallOnMedium />
        </div>

        {/* Survey — right on desktop, below poem on mobile. Scrolls with the page. */}
        <div>
          <SurveyScroll
            key={`survey-${currPoem}`}
            survey={AudiencePoemQuestions}
            onSubmit={handleSubmit}
            buttonText={currPoem < poems.length - 1 ? "Next Poem" : "Finish"}
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
