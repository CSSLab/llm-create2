import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudienceAIQuestionSurvey } from "../../../consts/surveyQuestions";
import type { Poem, SurveyDefinition, Section, SurveyAnswers } from "../../../types";

interface FirebasePoem extends Poem {
  id: string;
  artistId: string;
}

const AudienceAI = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;

  const passageId = (userData as any)?.data?.passage || "1";
  const passage = Passages.find((p) => p.id === passageId) || Passages[0];

  // Poems were fetched once at captcha time and stay fixed for the rest of
  // the study, so this shows the same 4 poems as Step 2/ranking. Poem docs
  // don't actually carry a nested `.passage` object (only `.passageId`), so
  // per-poem rendering falls back to the shared passage, same as Step2Rank.
  const poems: FirebasePoem[] = (userData as any)?.data?.poems ?? [];

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
      // initialize
      onScroll();
      return () => container.removeEventListener("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, []);

  const handleSubmit = (answers: SurveyAnswers) => {
    const surveyResponse = ((userData?.data as any)?.surveyResponse ?? {}) as any;

    addRoleSpecificData({
      surveyResponse: {
        ...surveyResponse,
        AISurvey: AudienceAIQuestionSurvey,
        AIAnswers: answers,
      },
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    } as any);
    navigate("/audience/post-survey");
  };
  const buildAudienceAISurvey = (): SurveyDefinition => {
    return {
      ...AudienceAIQuestionSurvey,
      sections: AudienceAIQuestionSurvey.sections.map((section: Section) => {
        if (section.id !== "section1") return section;

        const questions = [
          {
            id: "ai-select-all",
            type: "selectAll",
            question:
              "Which poems do you believe were created with AI assistance?",
            required: true,
            // Show every poem's content by default, like Step2Rank, instead
            // of collapsed behind a "View Poem" toggle.
            defaultExpanded: poems.map((_, i) => `poem-${i}`),
            items: [
              ...poems.map((poem, i) => {
                const poemId = `poem-${i}`;
                const poemWords =
                  poem.passage?.text?.split(" ") ?? passage.text.split(" ");
                const selectedIndexes: number[] = Array.isArray(poem.text)
                  ? (poem.text as unknown as number[])
                  : [];

                return {
                  id: poemId,
                  title: `Poem ${i + 1}`,
                  content: (
                    <div
                      className="order-2 md:order-1 flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] h-max"
                      onCopy={(e) => e.preventDefault()}
                    >
                      {poemWords.map((word, j) => {
                        const isVisible = selectedIndexes.includes(j);

                        return (
                          <span
                            key={j}
                            className={`text-sm font-serif tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200 ${
                              isVisible
                                ? "text-black bg-white"
                                : "text-transparent bg-dark-grey"
                            }`}
                          >
                            {word + "\u00A0"}
                          </span>
                        );
                      })}
                      <p className="text-xs text-grey text-left pt-2 w-full">
                        <span className="italic">{'"' + passage.title + '"'}</span>
                        <span>{", " + passage.author}</span>
                      </p>
                    </div>
                  ),
                };
              }),
              {
                id: "none",
                title: "None of the poems were created with AI",
              },
            ],
          },
          {
            id: "ai-decision",
            type: "openEnded",
            question: "What factors impacted your decision?",
            placeholder: "Type your answer here...",
            required: true,
          },
        ];

        return {
          ...section,
          questions,
        };
      }),
    } as SurveyDefinition;
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

  return (
    <PageTemplate
      title={`Step 2: Which poems were created with AI?`}
      description="During the creation of the blackout poems, some artists had the option to create with the assistance of an AI tool. Please review each poem and indicate which poem(s) you believe were created with AI assistance."
    >
      <SurveyScroll
        key={`survey-ai`}
        survey={buildAudienceAISurvey()}
        onSubmit={handleSubmit}
        buttonText={"Next"}
        noProgressBar
      />
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

export default AudienceAI;
