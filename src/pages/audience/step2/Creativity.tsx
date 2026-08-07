import { Button, RadioGroup } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../../App";
import AudiencePoemDisplay from "../../../components/audience/AudiencePoemDisplay";
import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { toaster } from "../../../components/ui/toaster";
import { AUDIENCE_CREATIVITY_OPTIONS } from "../../../consts/surveyQuestions";
import type { Audience } from "../../../types";

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
      title={`Source reveal and creativity (${poemIndex + 1} of ${poems.length})`}
      description="Now that the earlier questions are complete, you can see the source passage used to create this poem."
    >
      <div className="flex flex-col gap-6 py-4 md:py-8">
        <div className="flex flex-col md:grid md:[grid-template-columns:1fr_1fr] gap-6 md:items-start">
          <div className="md:sticky md:top-4 flex justify-center">
            <AudiencePoemDisplay poem={poem} label={`Poem ${poemIndex + 1}`} />
          </div>
          <article className="rounded-lg border border-light-grey-2 p-6">
            <p className="text-h3 mb-3">Source text</p>
            <div className="flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] md:min-w-[400px] md:w-[400px] h-max">
              {passage.text.split(" ").map((word, i) => (
                <span
                  key={i}
                  className="text-main font-serif text-dark-grey tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200"
                >
                  {word + " "}
                </span>
              ))}
              <p className="text-xs text-grey text-left pt-2 w-full">
                <span className="italic">{'"' + passage.title + '"'}</span>
                <span>{", " + passage.author}</span>
                {passage.publication ? (
                  <span>{", " + passage.publication}</span>
                ) : null}
              </p>
            </div>
          </article>
        </div>

        <fieldset className="space-y-4 rounded-lg border border-light-grey-2 p-6">
          <legend className="text-main px-1">
            Considering the source text and the constraints of blackout poetry,
            how creative do you find this poem?
            <span className="text-red-700">*</span>
          </legend>
          <RadioGroup.Root
            value={rating?.toString() ?? ""}
            onValueChange={({ value }) =>
              setRating(value ? Number.parseInt(value, 10) : null)
            }
            className="grid gap-3 md:grid-cols-7"
          >
            {AUDIENCE_CREATIVITY_OPTIONS.map((option) => {
              const selected = rating === option.value;
              const dimmed = !selected && rating !== null;
              return (
                <RadioGroup.Item
                  key={option.value}
                  value={option.value.toString()}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all duration-150 hover:opacity-100 md:flex-col md:items-center md:justify-center md:text-center ${
                    selected
                      ? "border-dark-grey bg-light-grey-4 opacity-100"
                      : dimmed
                        ? "border-light-grey-2 opacity-70"
                        : "border-light-grey-2 opacity-100"
                  }`}
                >
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator className="h-4 w-4 shrink-0 rounded-full border border-light-grey-1 focus:border-grey focus:border-2 md:mx-auto" />
                  <RadioGroup.ItemText className="text-sub md:w-full md:text-center">
                    {option.label}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              );
            })}
          </RadioGroup.Root>
        </fieldset>

        <div className="w-full flex justify-center">
          <Button className="btn-primary" onClick={handleNext}>
            {poemIndex === poems.length - 1 ? "Continue" : "Next poem"}
          </Button>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Creativity;
