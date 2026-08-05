import { Button, RadioGroup } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../App";
import AudiencePoem from "../../components/audience/AudiencePoem";
import FullPageTemplate from "../../components/shared/pages/fullScrollPage";
import { toaster } from "../../components/ui/toaster";
import { AUDIENCE_CREATIVITY_OPTIONS } from "../../consts/surveyQuestions";
import type { Audience } from "../../types";

const Creativity = () => {
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
  const passage = poem.passage;

  const handleNext = () => {
    if (rating === null) {
      toaster.create({
        description: "Please select a creativity rating to continue.",
        type: "error",
        duration: 5000,
      });
      return;
    }

    const isLastPoem = poemIndex === poems.length - 1;
    addRoleSpecificData({
      surveyResponse: {
        ...audienceData.surveyResponse,
        creativityRatings: [
          ...audienceData.surveyResponse.creativityRatings,
          { poemId: poem.id, rating },
        ],
      },
      ...(isLastPoem
        ? { timeStamps: [...audienceData.timeStamps, new Date()] }
        : {}),
    });

    if (isLastPoem) {
      navigate("/audience/ai-detection");
    } else {
      setPoemIndex((current) => current + 1);
      setRating(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <FullPageTemplate
      title={`Source reveal and creativity (${poemIndex + 1} of ${poems.length})`}
      description="Now that the earlier questions are complete, you can see the source passage used to create this poem."
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <AudiencePoem poem={poem} label={`Poem ${poemIndex + 1}`} />
          <article className="rounded-xl border border-light-grey-2 bg-white p-5 sm:p-6">
            <h2 className="mb-3 text-h3">Source text</h2>
            <p className="font-serif text-sm leading-relaxed text-dark-grey sm:text-base">
              {passage.text}
            </p>
            <p className="mt-4 text-xs text-grey">
              <span className="italic">“{passage.title}”</span>, {passage.author}
              {passage.publication ? `, ${passage.publication}` : ""}
            </p>
          </article>
        </div>

        <fieldset className="space-y-4 rounded-xl border border-light-grey-2 bg-white p-6">
          <legend className="px-1 text-main">
            Considering the source text and the constraints of blackout poetry,
            how creative do you find this poem?*
          </legend>
          <RadioGroup.Root
            value={rating?.toString() ?? ""}
            onValueChange={({ value }) =>
              setRating(value ? Number.parseInt(value, 10) : null)
            }
            className="grid gap-3 md:grid-cols-7"
          >
            {AUDIENCE_CREATIVITY_OPTIONS.map((option) => (
              <RadioGroup.Item
                key={option.value}
                value={option.value.toString()}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-light-grey-2 p-3 md:flex-col md:text-center"
              >
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator className="h-4 w-4 shrink-0 rounded-full border border-light-grey-1" />
                <RadioGroup.ItemText className="text-sub">
                  {option.label}
                </RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
          <Button className="btn-primary" onClick={handleNext}>
            {poemIndex === poems.length - 1 ? "Continue" : "Next poem"}
          </Button>
        </fieldset>
      </div>
    </FullPageTemplate>
  );
};

export default Creativity;
