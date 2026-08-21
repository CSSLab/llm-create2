import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect, useRef } from "react";
import { DataContext } from "../../../App";
import FullPageTemplate from "../../../components/shared/pages/fullScrollPage";
import BlackoutPoetry from "../../../components/blackout/Blackout";
import { Button } from "@chakra-ui/react";
import type { PoemSnapshot } from "../../../types";
import { Passages } from "../../../consts/passages";

const STEPS = [
  {
    heading: "Select a word",
    body: "Click any word in the passage to add it to your poem. Selected words stay visible while the rest are blacked out.",
  },
  {
    heading: "Keep selecting",
    body: "Your chosen words appear on the right as your poem takes shape. Select a few more to see it grow.",
  },
  {
    heading: "Remove a word",
    body: "Changed your mind? Click any selected word again to remove it from your poem.",
  },
  {
    heading: "You're all set!",
    body: "Now take a moment to build a short poem with this passage. When you're ready, continue to the main task.",
  },
];

const ArtistTutorial = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;

  const passage = Passages.find((p) => p.id === "2")!;

  const [selectedWordIndexes, setSelectedWordIndexes] = useState<number[]>([]);
  const [, setPoemSnapshots] = useState<PoemSnapshot[]>([]);
  const [step, setStep] = useState(0);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const count = selectedWordIndexes.length;
    const prev = prevCountRef.current;

    if (step === 0 && count >= 1) {
      setStep(1);
    } else if (step === 1 && count >= 3) {
      setStep(2);
    } else if (step === 2 && count < prev) {
      setStep(3);
    }

    prevCountRef.current = count;
  }, [selectedWordIndexes]);

  const handleContinue = () => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/brainstorm");
  };

  const current = STEPS[step];

  return (
    <FullPageTemplate title="Tutorial" background="bg2">
      <div className="w-full flex flex-col space-y-6 pb-8">
        {/* Step card */}
        <div className="w-full border border-light-grey-2 rounded-lg p-5 space-y-3">
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-dark-grey w-6" : "bg-light-grey-2 w-3"
                }`}
              />
            ))}
            <span className="text-xs text-grey ml-1">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Instruction */}
          <div key={step} className="animate-fade-in">
            <p className="text-h3">{current.heading}</p>
            <p className="text-sub mt-1">{current.body}</p>
          </div>
        </div>

        {/* Blackout interface */}
        <BlackoutPoetry
          passageText={passage.text}
          passageTitle={passage.title}
          passageAuthor={passage.author}
          selectedWordIndexes={selectedWordIndexes}
          setSelectedWordIndexes={setSelectedWordIndexes}
          setPoemSnapshots={setPoemSnapshots}
        />

        {/* Continue — only shown on final step */}
        {step === 3 && (
          <div className="flex justify-center pt-2 animate-fade-in">
            <Button className="btn-primary" onClick={handleContinue}>
              Continue to Task
            </Button>
          </div>
        )}
      </div>
    </FullPageTemplate>
  );
};

export default ArtistTutorial;
