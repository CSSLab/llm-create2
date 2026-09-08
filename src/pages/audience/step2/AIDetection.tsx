import { Button, Slider } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../../App";
import AudiencePoemDisplay from "../../../components/audience/AudiencePoemDisplay";
import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { toaster } from "../../../components/ui/toaster";
import type { Audience } from "../../../types";

const AIDetection = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;
  const navigate = useNavigate();
  const audienceData = userData?.data as Audience;
  const poems = audienceData.assignment.poems;
  const [poemIndex, setPoemIndex] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const poem = poems[poemIndex];

  const handleNext = () => {
    if (rating === null) {
      toaster.create({
        description: "Please choose an estimate on the scale.",
        type: "error",
        duration: 5000,
      });
      return;
    }

    const isLastPoem = poemIndex === poems.length - 1;
    addRoleSpecificData({
      surveyResponse: {
        ...audienceData.surveyResponse,
        aiLikelihoodRatings: [
          ...audienceData.surveyResponse.aiLikelihoodRatings,
          { poemId: poem.id, rating },
        ],
      },
      ...(isLastPoem
        ? { timeStamps: [...audienceData.timeStamps, new Date()] }
        : {}),
    });

    if (isLastPoem) {
      navigate("/audience/post-survey");
    } else {
      setPoemIndex((current) => current + 1);
      setRating(null);
      const container = document.querySelector(
        ".overflow-y-auto",
      ) as HTMLElement | null;
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <PageTemplate
      title={`AI assistance estimate (${poemIndex + 1} of ${poems.length})`}
      description="For each poem, give your own estimate of whether the creator had access to AI assistance."
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-4 md:py-6">
        <div className="mx-auto w-full max-w-[400px]" role="region" aria-label={`Poem ${poemIndex + 1}`}>
          <AudiencePoemDisplay poem={poem} />
        </div>
        <section className="space-y-6 border-t border-light-grey-2 pt-6 sm:pt-8" aria-labelledby="ai-estimate-question">
          <p id="ai-estimate-question" className="text-main text-center">
            How likely is it that the creator had access to AI assistance while
            making this poem?
            <span className="text-red-700">*</span>
          </p>

          <div className="w-full px-3">
            <Slider.Root
              unstyled
              key={poem.id}
              value={[rating ?? 50]}
              min={0}
              max={100}
              step={1}
              thumbAlignment="center"
              onValueChange={(e) => setRating(e.value[0] ?? null)}
              onValueChangeEnd={(e) => setRating(e.value[0] ?? null)}
              getAriaValueText={({ value }) => rating === null ? "No estimate selected" : `${value}% likelihood of access to AI`}
              className="relative w-full"
            >
              <Slider.Label className="sr-only">
                AI assistance likelihood
              </Slider.Label>
              <Slider.Control className="relative flex h-11 w-full touch-none items-center">
                <Slider.Track className="relative h-1 flex-1 overflow-hidden rounded-full bg-light-grey-2">
                  <Slider.Range className={`h-full ${rating === null ? "bg-transparent" : "bg-dark-grey"}`} />
                </Slider.Track>
                <Slider.Thumb
                  index={0}
                  aria-describedby="ai-scale-help ai-scale-anchors"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setRating(rating ?? 50);
                    }
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-dark-grey bg-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dark-grey"
                >
                  <Slider.HiddenInput />
                </Slider.Thumb>
              </Slider.Control>
              <div className="relative h-9 w-full" aria-hidden="true">
                {[0, 25, 50, 75, 100].map((value) => (
                  <span key={value} style={{ left: `${value}%` }} className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1 text-xs tabular-nums text-grey">
                    <span className="h-1.5 w-px bg-light-grey-2" />
                    {value}%
                  </span>
                ))}
              </div>
            </Slider.Root>

            <div id="ai-scale-anchors" className="mt-1 flex w-full justify-between gap-10 text-sm leading-snug text-grey">
              <span className="max-w-[11rem]">
                Definitely did not have access to AI
              </span>
              <span className="max-w-[11rem] text-right">
                Definitely had access to AI
              </span>
            </div>
          </div>

          <div className="space-y-1 text-center">
            <p className="text-h2 text-center tabular-nums" aria-live="polite">
              {rating === null ? "Choose your estimate" : `Your estimate: ${rating}%`}
            </p>
            <p id="ai-scale-help" className="text-sm text-grey">
              Click or drag the scale to choose your estimate.
              <span className="sr-only"> Use the arrow keys to adjust. Press Enter to select the current position.</span>
            </p>
          </div>
          <div className="w-full flex justify-center">
            <Button className="btn-primary" onClick={handleNext}>
              {poemIndex === poems.length - 1 ? "Continue" : "Next poem"}
            </Button>
          </div>
        </section>
      </div>
    </PageTemplate>
  );
};

export default AIDetection;
