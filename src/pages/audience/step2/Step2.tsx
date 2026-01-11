import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import { Poems } from "../../../consts/poems";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudiencePoemQuestions } from "../../../consts/surveyQuestions";
import { Button } from "@chakra-ui/react";
import { LuEyeClosed } from "react-icons/lu";
import { HiOutlineDocumentText } from "react-icons/hi2";

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

  const passageId = (userData as any)?.data?.passageId || "1";

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];
  const words = passage.text.split(" ");

  const poems = Poems;

  useEffect(() => {
    const container = document.querySelector(
      ".overflow-y-auto"
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

  const handleSubmit = () => {
    if (currPoem < poems.length - 1) {
      setCurrPoem(currPoem + 1);
      const container = document.querySelector(
        ".overflow-y-auto"
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
    navigate("/audience/passage");
  };

  return (
    <PageTemplate
      title={`Step 2: Read the blackout poems (Poem ${currPoem + 1} of ${
        poems.length
      })`}
      description="This is your time to read several blackout poems created from the text you just read and answer a couple of questions about each poem."
    >
      {/* Top Controls */}
      <div className="w-full flex flex-row justify-between">
        <div className="flex flex-row space-x-2">
          <Button
            className="btn-small-inverted"
            onClick={() => setShowPassage(!showPassage)}
          >
            {!showPassage ? <LuEyeClosed /> : <HiOutlineDocumentText />}
            <p className="hidden md:block">
              {!showPassage ? "View Poem" : "View Passage"}
            </p>
          </Button>
        </div>
      </div>
      <div className="w-[50vh] md:w-[60vh] h-max flex-col space-y-6 pt-4 md:pt-8 self-center">
        <div className="leading-none text-justify select-none h-max">
          {words.map((word, i) => {
            const isVisible = poems[currPoem].text.includes(i);
            return (
              <span
                key={i}
                className={`text-sm md:text-base transition duration-300  ${
                  isVisible || showPassage
                    ? "text-black bg-white"
                    : "text-transparent bg-dark-grey"
                }`}
              >
                {word + " "}
              </span>
            );
          })}
          <p className="text-xs text-grey text-left pt-2">
            <span className="italic">{'"' + passage.title + '"'}</span>
            <span>{", " + passage.author + " from The New York Times"}</span>
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
              ".overflow-y-auto"
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
          ↑ Top
        </button>
      )}
    </PageTemplate>
  );
};

export default AudiencePoems;
