import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import { Poems } from "../../../consts/poems";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudienceReRankingQuestions } from "../../../consts/surveyQuestions";
import type { SurveyDefinition, Section, SurveyAnswers, PoemRankings, ReRankingData } from "../../../types";

// Dummy data for standalone rendering/testing
// const defaultContextValue = {
//   userData: {
//     role: "audience" as const,
//     data: {
//       passage: "1",
//       timeStamps: [] as Date[],
//       poemsViewed: ["poem1", "poem2", "poem3", "poem4"],
//     },
//   },
//   addRoleSpecificData: (_updates: any) => {
//     console.log("[Standalone Mode] addRoleSpecificData called:", _updates);
//   },
//   addReRankSurvey: (_reRankingData: ReRankingData) => {
//     console.log("[Standalone Mode] addReRankSurvey called:", _reRankingData);
//   },
// };

const AudienceReRanking = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData, addReRankSurvey } = context;
  // const { userData, addRoleSpecificData, addReRankSurvey } = context ?? defaultContextValue;


  const passageId = (userData as any)?.data?.passageId || "1";
  const poemsViewed: string[] = (userData as any)?.data?.poemsViewed || ["poem1", "poem2", "poem3", "poem4"];

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];
  const poems = Poems;
  const surveyWithItems = (() => {
    const words = passage.text.split(" ");

    return {
      ...AudienceReRankingQuestions,
      sections: AudienceReRankingQuestions.sections.map((section: Section) => {
        // ---- SECTION 1: dragRank ----
        if (section.id === "section1") {
          return {
            ...section,
            questions: section.questions.map((q) => {
              if (q.type !== "dragRank") return q;

              const items = poems.map((poem, i) => ({
                id: `${q.id}-poem-${i}`,
                title: `Poem ${i + 1}`,
                content: (
                  <div className="w-[50vh] h-max flex-col space-y-6 py-4 self-center">
                    <div className="flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] md:min-w-[400ox] md:w-[400px] h-max">
                      {words.map((word, i) => {
                        const isVisible = poem.text.includes(i);
                        return (
                          <span
                            key={i}
                            className={`text-sm transition duration-300 ${
                              isVisible
                                ? "text-black bg-white"
                                : "text-transparent bg-dark-grey"
                            }`}
                          >
                            {word + "\u00A0"}
                          </span>
                        );
                      })}
                      <p className="text-xs text-grey text-left pt-2">
                        <span className="italic">
                          {'"' + passage.title + '"'}
                        </span>
                        <span>{", " + passage.author}</span>
                      </p>
                    </div>
                  </div>
                ),
              }));

              return { ...q, items };
            }),
          };
        }

        return section;
      }),
    } as SurveyDefinition;
  })();

  //     return {
  //       ...AudienceRankingQuestions,
  //       sections: AudienceRankingQuestions.sections.map((section) => ({
  //         ...section,
  //         questions: section.questions.map((q) =>
  //           q.type === "dragRank" ? { ...q, items } : q
  //         ),
  //       })),
  //     };
  //   })();

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
    // Helper to process a dragRank answer into ordered poemIds
    const processRanking = (questionId: string): string[] => {
      const rankingAnswer = answers[questionId] as string[] | undefined;
      return rankingAnswer
        ? rankingAnswer.map((itemId) => {
            // Extract poem index from item ID (e.g., "q1-poem-2" -> 2)
            const match = itemId.match(/poem-(\d+)$/);
            const index = match ? parseInt(match[1], 10) : 0;
            return poemsViewed[index] || itemId;
          })
        : [];
    };

    // Process all three re-rankings
    const poemRankings: PoemRankings = {
      favourite: processRanking("q1"),
      impact: processRanking("q2"),
      creative: processRanking("q3"),
    };

    // Save re-ranking data
    const reRankingData: ReRankingData = {
      poemRankings,
    };
    console.log(reRankingData);
    addReRankSurvey(reRankingData);

    // Update timestamps and navigate
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/post-survey");
  };

  return (
    <PageTemplate
      title={`Step 2: Re-rank the poems`}
      description="Below, we have indicated  which poem(s) were created with AI assistance. If you would like to re-rank your poems please do so."
    >
      <div></div>

      <div className="w-[50vh] md:w-[60vh] h-max flex-col space-y-6 pt-4 md:pt-8 self-center">
        <p
          className="text-main text-justify text-sm md:text-base select-none"
          onCopy={(e) => e.preventDefault()}
        >
          {passage.text}
        </p>
        <p className="text-xs text-grey text-left pt-2">
          <span className="italic">{'"' + passage.title + '"'}</span>
          <span>{", " + passage.author + " from The New York Times"}</span>
        </p>
      </div>
      <SurveyScroll
        key={`survey-rank`}
        survey={surveyWithItems}
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

export default AudienceReRanking;
