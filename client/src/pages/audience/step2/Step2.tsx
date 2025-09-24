import { useState } from "react";
import { RadioGroup, Text, Textarea } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "../../../components/shared/pages/page";
import { toaster } from "../../../components/ui/toaster";

type QuestionType = "multiple" | "text";

interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
}

const blackoutPoems = [
  {
    id: 1,
    passage: "The wind whispers over hollow bones and buried wishes",
    selectedIndexes: [1, 2, 4, 5],
  },
  {
    id: 2,
    passage: "Beneath shadows, the moon remembers names we forget",
    selectedIndexes: [0, 3, 5, 6],
  },
  {
    id: 3,
    passage: "The silence stretched until it became a song of stars",
    selectedIndexes: [1, 2, 5, 7],
  },
];

const survey: SurveyQuestion[] = [
  {
    id: "q1",
    question: "What emotions does this poem evoke for you?",
    type: "text",
  },
  {
    id: "q2",
    question: "What features do you use the most?",
    type: "multiple",
    options: ["Feature A", "Feature B", "Feature C"],
  },
  {
    id: "q3",
    question: "Any additional feedback?",
    type: "text",
  },
  {
    id: "q4",
    question: "Any additional feedback?",
    type: "text",
  },
];

const renderBlackout = (passage: string, selectedIndexes: number[]) => {
  const words = passage.split(" ");
  return (
    <div className="cursor-pointer bg-white text-main w-full text-base flex flex-col space-y-2">
      <div className="flex flex-wrap leading-relaxed">
        {words.map((word, i) => {
          const isVisible = selectedIndexes.includes(i);
          return (
            <span
              key={i}
              className={
                `cursor-pointer transition px-1 duration-200 text-main ` +
                (isVisible ? "" : "bg-dark-grey")
              }
            >
              {word + ` `}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const AudienceStep2 = () => {
  const [poemIndex, setPoemIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<number, Record<string, string>>
  >({});
  const navigate = useNavigate();

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [poemIndex]: {
        ...prev[poemIndex],
        [questionId]: value,
      },
    }));
  };

  const allQuestionsAnswered = () => {
    return survey.every(
      (q) => (answers[poemIndex]?.[q.id] || "").trim() !== ""
    );
  };

  const handleNext = () => {
    if (!allQuestionsAnswered()) {
      toaster.create({
        description: "Please answer all required (*) questions to continue.",
        type: "error",
        duration: 5000,
      });
      return;
    }
    if (poemIndex < blackoutPoems.length - 1) {
      setPoemIndex(poemIndex + 1);
    } else {
      console.log("Survey results:", answers);
      navigate("/audience/post-survey");
    }
  };

  const currentPoem = blackoutPoems[poemIndex];

  return (
    <PageTemplate
      title={"Part 2: Share your thoughts"}
      background="bg3"
      description={
        "For each poem, you will fill out a quick survey letting us know what you think of the work. Once you answer for one poem, you cannot return to it."
      }
      duration={720}
      nextButton={{
        text: poemIndex === blackoutPoems.length - 1 ? "Finish" : "Next Poem",
        action: handleNext,
      }}
    >
      <div className="py-6 w-full flex flex-col md:flex-row h-max md:h-full">
        <div className="w-full md:w-1/2 h-full">
          <div className="text-h1 text-lg mb-4">
            Poem {poemIndex + 1} of {blackoutPoems.length}
          </div>

          {renderBlackout(currentPoem.passage, currentPoem.selectedIndexes)}
        </div>

        <div className="w-full md:w-1/2 h-full overflow-auto">
          <div className="flex flex-col space-y-4 mt-8">
            {survey.map((q) => (
              <div key={q.id}>
                <Text className="text-main mb-2">{q.question}</Text>
                {q.type === "multiple" && (
                  <RadioGroup.Root
                    value={answers[poemIndex]?.[q.id] || ""}
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
                    value={answers[poemIndex]?.[q.id] || ""}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    size="sm"
                  />
                )}
              </div>
            ))}
          </div>

          {/* <Button
          mt={8}
          className='btn-primary'
          onClick={handleNext}
          disabled={!allQuestionsAnswered()}
        >
          {poemIndex === blackoutPoems.length - 1 ? 'Finish' : 'Next Poem'}
        </Button> */}
        </div>
      </div>
    </PageTemplate>
  );
};

export default AudienceStep2;
