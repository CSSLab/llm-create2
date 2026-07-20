import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import type { Poem } from "../../../types";
import { AudienceCondition } from "../../../types";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudiencePoemQuestions } from "../../../consts/surveyQuestions";
import { Button, Spinner } from "@chakra-ui/react";
import { LuEyeClosed } from "react-icons/lu";
import { HiOutlineDocumentText } from "react-icons/hi2";

interface FirebasePoem extends Poem {
  id: string;
  artistId: string;
}

const NUM_POEMS = 4;

const AudiencePoems = () => {
  const [currPoem, setCurrPoem] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  const [poems, setPoems] = useState<FirebasePoem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overviews, setOverviews] = useState<Record<string, string>>({});

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
  const words = passage.text.split(" ");

  // Fetch poems from Firebase on mount
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const res = await fetch("/api/firebase/audience-poems");
        const data = await res.json();
        const allPoems: FirebasePoem[] = data.poems ?? [];

        // Shuffle and pick NUM_POEMS
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

  // Fetch or generate overview for current poem when condition is WITH_AI_OVERVIEW
  useEffect(() => {
    if (!withAIOverview || poems.length === 0) return;
    const poem = poems[currPoem];
    if (!poem || overviews[poem.id] !== undefined) return;

    const getOrGenerateOverview = async () => {
      // Check cache in Firebase
      const checkRes = await fetch(`/api/firebase/poem-overview/${poem.id}`);
      const checkData = await checkRes.json();

      if (checkData.overview) {
        setOverviews((prev) => ({ ...prev, [poem.id]: checkData.overview }));
        return;
      }

      // Generate via LLM
      try {
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

        // Store in Firebase
        await fetch(`/api/firebase/poem-overview/${poem.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overview }),
        });

        setOverviews((prev) => ({ ...prev, [poem.id]: overview }));
      } catch (err) {
        console.error("Failed to generate overview:", err);
        setOverviews((prev) => ({ ...prev, [poem.id]: "" }));
      }
    };

    getOrGenerateOverview();
  }, [currPoem, poems, withAIOverview]);

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
    if (currPoem < poems.length - 1) {
      setCurrPoem(currPoem + 1);
      setShowPassage(false);
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
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/post-survey");
  };

  if (loading) {
    return (
      <PageTemplate title="Loading poems..." description="">
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      </PageTemplate>
    );
  }

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
  const currentOverview = withAIOverview
    ? (overviews[currentPoem?.id] ?? null)
    : null;

  const poemWords = currentPoem?.passage?.text?.split(" ") ?? words;
  const selectedIndexes: number[] = Array.isArray(currentPoem?.text)
    ? (currentPoem.text as unknown as number[])
    : [];

  return (
    <PageTemplate
      title={`Step 2: Read the blackout poems (Poem ${currPoem + 1} of ${
        poems.length
      })`}
      description="Take your time to read and reflect on each poem, then answer the questions below."
    >
      {/* Top Controls */}
      <div className="w-full flex flex-row justify-between">
        <div className="flex flex-row space-x-2">
          <Button
            className="btn-small-inverted"
            onClick={() => setShowPassage(!showPassage)}
          >
            {showPassage ? <LuEyeClosed /> : <HiOutlineDocumentText />}
            <p className="hidden md:block">
              {showPassage ? "View as Poem" : "View as Passage"}
            </p>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 py-4 md:py-8 self-center">
        {/* Overview — top on mobile, right on desktop */}
        {withAIOverview && (
          <div className="order-1 md:order-2 md:w-64 shrink-0 self-start p-4 border rounded-lg border-light-grey-2 bg-gray-50">
            <p className="text-sub font-semibold mb-2">AI Overview</p>
            {currentOverview === null ? (
              <div className="flex items-center gap-2 text-sub text-light-grey-1">
                <Spinner size="sm" />
                <span>Generating overview...</span>
              </div>
            ) : currentOverview === "" ? (
              <p className="text-sub text-light-grey-1 italic">
                Overview unavailable.
              </p>
            ) : (
              <p className="text-main text-sm">{currentOverview}</p>
            )}
          </div>
        )}

        {/* Poem */}
        <div
          className="order-2 md:order-1 flex flex-wrap select-none h-max w-[355px] min-w-[355px] md:min-w-[400px] md:w-[400px]"
          onCopy={(e) => e.preventDefault()}
        >
          {poemWords.map((word, i) => {
            const isVisible = selectedIndexes.includes(i);
            const blackoutStyle =
              isVisible || showPassage
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

      <SurveyScroll
        key={`survey-${currPoem}`}
        survey={AudiencePoemQuestions}
        onSubmit={handleSubmit}
        buttonText={currPoem < poems.length - 1 ? "Next Poem" : "Finish"}
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

export default AudiencePoems;
