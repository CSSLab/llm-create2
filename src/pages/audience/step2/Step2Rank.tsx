import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudienceRankingQuestions } from "../../../consts/surveyQuestions";
import type {
  Poem,
  SurveyDefinition,
  Section,
  SurveyAnswers,
} from "../../../types";
import { AudienceCondition } from "../../../types";
import { Spinner } from "@chakra-ui/react";

interface FirebasePoem extends Poem {
  id: string;
  artistId: string;
}

const AudienceRanking = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [artistStatements, setArtistStatements] = useState<string[]>([]);
  const [statementsLoading, setStatementsLoading] = useState(true);

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

  // Poems and overviews were fetched once at captcha time and stay fixed
  // for the rest of the study, so this shows the same 4 poems as Step 2.
  const poems: FirebasePoem[] = (userData as any)?.data?.poems ?? [];
  const overviews: Record<string, string> =
    (userData as any)?.data?.overviews ?? {};

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];

  const statementOptions = [...artistStatements, "Unsure"];

  // Fetch the real artist statements for the poems being shown, plus a set
  // of decoy statements from other poems, and shuffle them together so
  // audience members can't guess by elimination alone.
  useEffect(() => {
    if (poems.length === 0) {
      setStatementsLoading(false);
      return;
    }

    const fetchArtistStatements = async () => {
      try {
        const poemIds = poems.map((p) => p.id);
        const [realRes, decoyRes] = await Promise.all([
          fetch("/api/firebase/audience/artist-statements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ poemIds }),
          }),
          fetch("/api/firebase/audience/distractor-statements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ excludePoemIds: poemIds, count: 4 }),
          }),
        ]);
        const realData = await realRes.json();
        const decoyData = await decoyRes.json();

        const realStatements: string[] = (realData.poemStatements ?? []).map(
          (s: { poemId: string; statement: string }) => s.statement,
        );
        const distractors: { poemId: string; statement: string }[] =
          decoyData.distractors ?? [];
        addRoleSpecificData({ distractorStatements: distractors });

        const decoyStatements = distractors.map((d) => d.statement);
        const combined = [...realStatements, ...decoyStatements];
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        setArtistStatements(combined);
      } catch (err) {
        console.error("Failed to fetch artist statements:", err);
        setArtistStatements([]);
      } finally {
        setStatementsLoading(false);
      }
    };

    fetchArtistStatements();
  }, [poems]);

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
    const surveyResponse = ((userData?.data as any)?.surveyResponse ?? {}) as any;

    addRoleSpecificData({
      surveyResponse: {
        ...surveyResponse,
        rankingSurvey: AudienceRankingQuestions,
        rankingAnswers: answers,
      },
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    } as any);
    navigate("/audience/rank-continued");
  };

  const renderPoem = (poem: FirebasePoem, _index: number) => {
    const poemWords = poem.passage?.text?.split(" ") ?? passage.text.split(" ");
    const selectedIndexes: number[] = Array.isArray(poem.text)
      ? (poem.text as unknown as number[])
      : [];
    const overview = withAIOverview ? (overviews[poem.id] ?? "") : "";

    return (
      <div className="flex flex-col md:flex-row gap-4 py-2">
        {/* Overview — top on mobile, right on desktop */}
        {withAIOverview && (
          <div className="order-1 md:order-2 order-1 md:order-2 md:w-52 shrink-0 p-4 border rounded-lg border-light-grey-2 bg-gray-50 overflow-y-auto">
            <p className="text-sub font-semibold mb-1 text-xs">AI Overview</p>
            {overview === "" ? (
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
          className="order-2 md:order-1 flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] h-max"
          onCopy={(e) => e.preventDefault()}
        >
          {poemWords.map((word, i) => {
            const isVisible = selectedIndexes.includes(i);

            return (
              <span
                key={i}
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
              return {
                ...q,
                items,
                // Show poems expanded by default on the first ranking
                // question only, since it's their first exposure here.
                ...(q.id === "q1" && {
                  defaultExpanded: items.map((item) => item.id),
                }),
              };
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
                options: statementOptions,
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
      {statementsLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="w-full flex justify-center pt-4 md:pt-8">
            <div
              className="flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] md:min-w-[400ox] md:w-[400px] h-max"
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
