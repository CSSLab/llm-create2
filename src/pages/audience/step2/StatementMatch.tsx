import { Button, RadioGroup } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../../App";
import AudiencePoemDisplay from "../../../components/audience/AudiencePoemDisplay";
import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { toaster } from "../../../components/ui/toaster";
import type { Audience } from "../../../types";

const StatementMatch = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;
  const navigate = useNavigate();
  const audienceData = userData?.data as Audience;
  const [trialIndex, setTrialIndex] = useState(0);
  const [selectedStatementId, setSelectedStatementId] = useState("");
  const trials = audienceData.assignment.statementTrials;
  const trial = trials[trialIndex];
  const poem = audienceData.assignment.poems.find(
    (candidate) => candidate.id === trial.poemId,
  );

  if (!poem) throw new Error("Statement trial poem was not found");

  const handleNext = () => {
    if (!selectedStatementId) {
      toaster.create({
        description: "Please select one statement to continue.",
        type: "error",
        duration: 5000,
      });
      return;
    }

    const isLastTrial = trialIndex === trials.length - 1;
    addRoleSpecificData({
      surveyResponse: {
        ...audienceData.surveyResponse,
        statementMatches: [
          ...audienceData.surveyResponse.statementMatches,
          {
            poemId: poem.id,
            selectedStatementId,
            isCorrect: selectedStatementId === poem.id,
          },
        ],
      },
      ...(isLastTrial
        ? { timeStamps: [...audienceData.timeStamps, new Date()] }
        : {}),
    });

    if (isLastTrial) {
      navigate("/audience/creativity");
    } else {
      setTrialIndex((current) => current + 1);
      setSelectedStatementId("");
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
      title={`Match the creator statement (${trialIndex + 1} of ${trials.length})`}
      description="Which statement best describes what the creator of this poem wanted it to express?"
    >
      <div className="flex flex-col md:grid md:[grid-template-columns:1fr_1fr] gap-6 py-4 md:py-8 md:items-start">
        <div className="md:sticky md:top-4 flex justify-center">
          <AudiencePoemDisplay poem={poem} label={`Poem ${trialIndex + 1}`} />
        </div>
        <div className="space-y-6 rounded-lg p-6">
          <RadioGroup.Root
            value={selectedStatementId}
            onValueChange={({ value }) => setSelectedStatementId(value ?? "")}
            className="space-y-4"
            aria-label="Creator statement options"
          >
            {trial.options.map((option) => {
              const selected = selectedStatementId === option.id;
              const dimmed = !selected && !!selectedStatementId;
              return (
                <RadioGroup.Item
                  key={option.id}
                  value={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all duration-150 hover:opacity-100 hover:border-grey ${
                    selected
                      ? "border-dark-grey bg-light-grey-4 opacity-100"
                      : dimmed
                        ? "border-light-grey-2 opacity-70"
                        : "border-light-grey-2 opacity-100"
                  }`}
                >
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator className="mt-1 h-4 w-4 shrink-0 rounded-full border border-light-grey-1 focus:border-grey focus:border-2" />
                  <RadioGroup.ItemText className="text-sub">
                    {option.statement}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              );
            })}
          </RadioGroup.Root>
          <Button className="btn-primary" onClick={handleNext}>
            {trialIndex < trials.length - 1 ? "Next poem" : "Continue"}
          </Button>
        </div>
      </div>
    </PageTemplate>
  );
};

export default StatementMatch;
