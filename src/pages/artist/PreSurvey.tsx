import { useState } from "react";
import { Box, VStack, RadioGroup, Text, Textarea } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../../components/shared/pages/halfPage";
import { useContext } from "react";
import { DataContext } from "../../App";

type QuestionType = "multiple" | "text";

interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For multiple choice
  scale?: number; // For scale questions (e.g., 7-point scale)
}

const survey: SurveyQuestion[] = [
  {
    id: "q2",
    question: "How are you feeling?",
    type: "multiple",
    options: ["Option A", "Option B", "Option C"],
  },
  { id: "q3", question: "Any additional feedback?", type: "text" },
];

const AristPreSurvey = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const handleAnswer = (id: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: answer,
    }));
  };

  const allQuestionsAnswered = () => {
    return survey.every((q) => (answers[q.id] || "").trim() !== "");
  };

  const handleSubmit = () => {
    if (!allQuestionsAnswered()) {
      alert("Please answer all the questions before submitting.");
      return;
    }

    console.log("Survey answers:", answers);
    navigate("/artist/instructions");
  };

  return (
    <HalfPageTemplate
      title="Pre-survey"
      description="Please fill out the following survey before we begin!"
      background="bg5"
      nextButton={{ text: "Submit", action: handleSubmit }}
    >
      <Box className="py-4 w-full h-full">
        <VStack align="stretch" className="space-y-4">
          {survey.map((q) => (
            <Box key={q.id}>
              <Text className="text-main" mb={2}>
                {q.question}
              </Text>
              {q.type === "multiple" && (
                <RadioGroup.Root
                  onValueChange={({ value }) => {
                    handleAnswer(q.id, value || "");
                  }}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {q.options!.map((option: string) => (
                      <RadioGroup.Item key={option} value={option}>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator className="border border-light-grey-1 focus:border-grey focus:border-2" />
                        <RadioGroup.ItemText className="text-sub">
                          {option}
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    ))}
                  </div>
                </RadioGroup.Root>
              )}

              {q.type === "text" && (
                <Textarea
                  placeholder="Your answer..."
                  className="border border-light-grey-1 p-2 text-base focus:border-grey h-24"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  size="sm"
                />
              )}
            </Box>
          ))}
        </VStack>
      </Box>
    </HalfPageTemplate>
  );
};

export default AristPreSurvey;
