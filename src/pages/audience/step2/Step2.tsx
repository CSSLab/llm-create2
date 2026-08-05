import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import type { Poem, SurveyAnswers } from "../../../types";
import { AudienceCondition } from "../../../types";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudiencePoemQuestions } from "../../../consts/surveyQuestions";
import { Button } from "@chakra-ui/react";
import { LuEyeClosed } from "react-icons/lu";
import { HiOutlineDocumentText } from "react-icons/hi2";

interface FirebasePoem extends Poem {
  id: string;
  artistId: string;
}

const AudiencePoems = () => {
  const [currPoem, setCurrPoem] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showPassage, setShowPassage] = useState(false);

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
  // for the rest of the study.
  const poems: FirebasePoem[] = (userData as any)?.data?.poems ?? [];
  const overviews: Record<string, string> =
    (userData as any)?.data?.overviews ?? {};

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];
  const words = passage.text.split(" ");

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
        poemSurvey: [
          ...(surveyResponse.poemSurvey ?? []),
          AudiencePoemQuestions,
        ],
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
    navigate("/audience/ranking");
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
  const currentOverview = withAIOverview
    ? (overviews[currentPoem?.id] ?? "")
    : "";

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
        <div className="flex flex-row space-x-2 w-full md:w-auto">
          <Button
            className="btn-small-inverted w-full md:w-auto justify-center"
            onClick={() => setShowPassage(!showPassage)}
          >
            {showPassage ? <LuEyeClosed /> : <HiOutlineDocumentText />}
            <p>{showPassage ? "View as Poem" : "View as Passage"}</p>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 py-4 md:py-8 self-center md:items-stretch">
        {/* Overview — top on mobile, right on desktop */}
        {withAIOverview && (
          <div className="order-1 md:order-2 md:w-64 shrink-0 p-4 border rounded-lg border-light-grey-2 bg-gray-50 overflow-y-auto">
            <p className="text-sub font-semibold mb-2">AI Overview</p>
            {currentOverview === "" ? (
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
          className="order-2 md:order-1 flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] md:min-w-[400ox] md:w-[400px] h-max "
          onCopy={(e) => e.preventDefault()}
        >
          {poemWords.map((word, i) => {
            const isVisible = selectedIndexes.includes(i) || showPassage;
            return (
              <span
                key={i}
                className={`text-main font-serif tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200 ${
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
