import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudienceRankingQuestions } from "../../../consts/surveyQuestions";
import type { Poem, SurveyDefinition, Section } from "../../../types";
import { AudienceCondition } from "../../../types";
import { Spinner } from "@chakra-ui/react";

interface FirebasePoem extends Poem {
  id: string;
  artistId: string;
}

const NUM_POEMS = 4;

const AudienceRanking = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [poems, setPoems] = useState<FirebasePoem[]>([]);
  const [overviews, setOverviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;

  const passageId = (userData as any)?.data?.passage || "1";
  const condition: AudienceCondition =
    (userData as any)?.data?.condition ?? AudienceCondition.WITHOUT_AI_OVERVIEW;
  const withAIOverview = condition === AudienceCondition.WITH_AI_OVERVIEW;

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];

  const artistStatements = [
    "Statement A",
    "Statement B",
    "Statement C",
    "Statement D",
    "Unsure",
  ];

  // Fetch poems from Firebase
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const res = await fetch("/api/firebase/audience-poems");
        const data = await res.json();
        const allPoems: FirebasePoem[] = data.poems ?? [];
        const shuffled = allPoems.sort(() => Math.random() - 0.5);
        setPoems(shuffled.slice(0, NUM_POEMS));
      } catch (err) {
        console.error("Failed to fetch poems:", err);
        setPoems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPoems();
  }, []);

  // Fetch cached overviews for all poems once they're loaded
  useEffect(() => {
    if (!withAIOverview || poems.length === 0) return;

    const fetchAllOverviews = async () => {
      for (const poem of poems) {
        if (overviews[poem.id] !== undefined) continue;
        try {
          const res = await fetch(`/api/firebase/poem-overview/${poem.id}`);
          const data = await res.json();
          if (data.overview) {
            setOverviews((prev) => ({ ...prev, [poem.id]: data.overview }));
          } else {
            // Generate if not cached yet
            const genRes = await fetch("/api/llm/generate-overview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                passageText: poem.passage?.text ?? passage.text,
                selectedWordIndexes: poem.text,
              }),
            });
            const genData = await genRes.json();
            const overview = genData.overview ?? "";
            await fetch(`/api/firebase/poem-overview/${poem.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ overview }),
            });
            setOverviews((prev) => ({ ...prev, [poem.id]: overview }));
          }
        } catch {
          setOverviews((prev) => ({ ...prev, [poem.id]: "" }));
        }
      }
    };

    fetchAllOverviews();
  }, [poems, withAIOverview]);

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

  const handleSubmit = () => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/post-survey");
  };

  const renderPoem = (poem: FirebasePoem, _index: number) => {
    const poemWords = poem.passage?.text?.split(" ") ?? passage.text.split(" ");
    const selectedIndexes: number[] = Array.isArray(poem.text)
      ? (poem.text as unknown as number[])
      : [];
    const overview = withAIOverview ? (overviews[poem.id] ?? null) : null;

    return (
      <div className="flex flex-col md:flex-row gap-4 py-2">
        {/* Overview — top on mobile, right on desktop */}
        {withAIOverview && (
          <div className="order-1 md:order-2 md:w-56 shrink-0 self-start p-3 border rounded-lg border-light-grey-2 bg-gray-50">
            <p className="text-sub font-semibold mb-1 text-xs">AI Overview</p>
            {overview === null ? (
              <div className="flex items-center gap-2 text-sub text-light-grey-1">
                <Spinner size="sm" />
                <span className="text-xs">Generating...</span>
              </div>
            ) : overview === "" ? (
              <p className="text-sub text-light-grey-1 italic text-xs">
                Unavailable.
              </p>
            ) : (
              <p className="text-main text-xs">{overview}</p>
            )}
          </div>
        )}

        {/* Poem */}
        <div
          className="order-2 md:order-1 flex flex-wrap select-none h-max w-[355px] min-w-[355px]"
          onCopy={(e) => e.preventDefault()}
        >
          {poemWords.map((word, i) => {
            const isVisible = selectedIndexes.includes(i);
            const blackoutStyle = isVisible
              ? "text-main font-serif text-dark-grey"
              : "text-main font-serif text-dark-grey bg-dark-grey";
            return (
              <span
                key={i}
                className={`tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200 ${blackoutStyle}`}
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
      </div>
    );
  };

  const surveyWithItems = (() => {
    if (poems.length === 0) return AudienceRankingQuestions as SurveyDefinition;

    return {
      ...AudienceRankingQuestions,
      sections: AudienceRankingQuestions.sections.map((section: Section) => {
        if (section.id === "section1") {
          return {
            ...section,
            questions: section.questions.map((q) => {
              if (q.type !== "dragRank") return q;
              const items = poems.map((poem, i) => ({
                id: `${q.id}-poem-${i}`,
                title: `Poem ${i + 1}`,
                content: renderPoem(poem, i),
              }));
              return { ...q, items };
            }),
          };
        }

        if (section.id === "section2") {
          return {
            ...section,
            questions: poems.flatMap((poem, i) => [
              {
                id: `q4-poem-${i}`,
                type: "multipleChoice",
                children: renderPoem(poem, i),
                question: `Poem ${i + 1}`,
                options: artistStatements,
                required: true,
              },
              {
                id: `q4-poem-${i}-unsure`,
                type: "openEnded",
                question:
                  "If you selected 'Unsure', please explain why (optional)",
                required: false,
                poemId: `poem-${i}`,
              },
            ]),
          };
        }

        return section;
      }),
    } as SurveyDefinition;
  })();

  return (
    <PageTemplate
      title="Step 2: Answer some questions about the poems"
      description="Now that you have read all the blackout poems, please answer the following questions about them."
    >
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="w-full flex justify-center pt-4 md:pt-8">
            <div
              className="flex flex-wrap select-none h-max w-[355px] min-w-[355px] md:min-w-[400px] md:w-[400px]"
              onCopy={(e) => e.preventDefault()}
            >
              {passage.text.split(" ").map((word, i) => (
                <span
                  key={i}
                  className="text-main font-serif text-dark-grey tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200"
                >
                  {word + "\u00A0"}
                </span>
              ))}
              <p className="text-xs text-grey text-left pt-2 w-full">
                <span className="italic">{'"' + passage.title + '"'}</span>
                <span>{", " + passage.author}</span>
              </p>
            </div>
          </div>
          <SurveyScroll
            key="survey-rank"
            survey={surveyWithItems}
            onSubmit={handleSubmit}
            buttonText="Next"
            noProgressBar
          />
        </>
      )}

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

export default AudienceRanking;
