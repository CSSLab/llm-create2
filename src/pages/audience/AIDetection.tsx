import { Button, Slider } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../App";
import AudiencePoem from "../../components/audience/AudiencePoem";
import FullPageTemplate from "../../components/shared/pages/fullScrollPage";
import { toaster } from "../../components/ui/toaster";
import type { Audience } from "../../types";

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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <FullPageTemplate
      title={`AI assistance estimate (${poemIndex + 1} of ${poems.length})`}
      description="For each poem, give your own estimate. There may be any number of poems whose creator had access to AI assistance."
    >
      <div className="mx-auto grid w-full max-w-5xl gap-8 py-4 lg:grid-cols-2 lg:items-start">
        <AudiencePoem poem={poem} label={`Poem ${poemIndex + 1}`} />
        <section className="space-y-6 rounded-xl border border-light-grey-2 bg-white p-6">
          <h2 className="text-main">
            How likely is it that the creator had access to AI assistance while
            making this poem?*
          </h2>
          <Slider.Root
            value={[rating ?? 50]}
            min={0}
            max={100}
            step={1}
            onValueChange={({ value }) => setRating(value[0] ?? null)}
            className="w-full"
          >
            <Slider.Label className="sr-only">AI assistance likelihood</Slider.Label>
            <Slider.Control className="h-6 w-full">
              <Slider.Track className="bg-white border border-light-grey-3">
                <Slider.Range className="bg-grey" />
              </Slider.Track>
              <Slider.Thumb
                index={0}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-grey"
              >
                <Slider.HiddenInput />
              </Slider.Thumb>
            </Slider.Control>
          </Slider.Root>
          <div className="flex justify-between gap-4 text-xs text-grey">
            <span>0 · Definitely did not have AI assistance</span>
            <span className="text-right">100 · Definitely had AI assistance</span>
          </div>
          <p className="text-center text-h2" aria-live="polite">
            {rating === null ? "Move the slider to answer" : `${rating}%`}
          </p>
          <Button className="btn-primary" onClick={handleNext}>
            {poemIndex === poems.length - 1 ? "Continue" : "Next poem"}
          </Button>
        </section>
      </div>
    </FullPageTemplate>
  );
};

export default AIDetection;
