import { Button, RadioGroup } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../App";
import AudiencePoem from "../../components/audience/AudiencePoem";
import FullPageTemplate from "../../components/shared/pages/fullScrollPage";
import { toaster } from "../../components/ui/toaster";
import type { Audience } from "../../types";

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
  const trial = audienceData.assignment.statementTrials[trialIndex];
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

    const isLastTrial = trialIndex === audienceData.assignment.statementTrials.length - 1;
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <FullPageTemplate
      title={`Match the creator statement (${trialIndex + 1} of ${audienceData.assignment.statementTrials.length})`}
      description="Which statement best describes what the creator of this poem wanted it to express?"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 py-4 lg:grid-cols-2 lg:items-start">
        <AudiencePoem poem={poem} label={`Poem ${trialIndex + 1}`} />
        <div className="space-y-6 rounded-xl border border-light-grey-2 bg-white p-6">
          <RadioGroup.Root
            value={selectedStatementId}
            onValueChange={({ value }) => setSelectedStatementId(value ?? "")}
            className="space-y-4"
            aria-label="Creator statement options"
          >
            {trial.options.map((option) => (
              <RadioGroup.Item
                key={option.id}
                value={option.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-light-grey-2 p-4 hover:border-grey"
              >
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator className="mt-1 h-4 w-4 shrink-0 rounded-full border border-light-grey-1" />
                <RadioGroup.ItemText className="text-main">
                  {option.statement}
                </RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
          <Button className="btn-primary" onClick={handleNext}>
            {trialIndex < audienceData.assignment.statementTrials.length - 1
              ? "Next poem"
              : "Reveal source text"}
          </Button>
        </div>
      </div>
    </FullPageTemplate>
  );
};

export default StatementMatch;
