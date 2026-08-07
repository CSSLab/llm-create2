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
        description: "Please move the slider to record your estimate.",
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
      description="For each poem, give your own estimate. There may be any number of poems whose creator had access to AI assistance."
    >
      <div className="flex flex-col md:grid md:[grid-template-columns:1fr_1fr] gap-6 py-4 md:py-8 md:items-start">
        <div className="md:sticky md:top-4 flex justify-center">
          <AudiencePoemDisplay poem={poem} label={`Poem ${poemIndex + 1}`} />
        </div>
        <section className="space-y-6 rounded-lg p-6">
          <p className="text-main">
            How likely is it that the creator had access to AI assistance while
            making this poem?
            <span className="text-red-700">*</span>
          </p>

          <div className="w-full flex flex-col items-center">
            <Slider.Root
              value={[rating ?? 50]}
              min={0}
              max={100}
              step={1}
              onValueChange={(e) => setRating(e.value[0] ?? null)}
              className="relative w-full h-6"
            >
              <Slider.Label className="sr-only">
                AI assistance likelihood
              </Slider.Label>
              <Slider.Control className="w-full h-2">
                <Slider.Track className="bg-white border border-light-grey-3">
                  <Slider.Range className="bg-grey" />
                </Slider.Track>
                <Slider.Thumb
                  index={0}
                  className="w-3 h-3 bg-grey rounded-full flex items-center justify-center"
                >
                  <Slider.HiddenInput />
                </Slider.Thumb>
              </Slider.Control>
            </Slider.Root>

            <div className="flex justify-between w-full mt-2">
              <span className="text-sub font-light text-sm">
                0 · Definitely did not have AI assistance
              </span>
              <span className="text-sub font-light text-sm text-right">
                100 · Definitely had AI assistance
              </span>
            </div>
          </div>

          <p className="text-center text-h2" aria-live="polite">
            {rating === null ? "Move the slider to answer" : `${rating}%`}
          </p>
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
