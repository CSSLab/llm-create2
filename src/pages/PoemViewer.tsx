import React, { useState } from "react";
import { Input, Button } from "@chakra-ui/react";
import { Passages } from "../consts/passages";

const PoemViewer: React.FC = () => {
  const [passageNumber, setPassageNumber] = useState("");

  const [passageText, setPassageText] = useState("");

  const [inputValue, setInputValue] = useState("");
  const words = passageText ? passageText.split(" ") : [];

  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(inputValue) as number[];
      if (Array.isArray(parsed)) {
        setVisibleIndexes(parsed);
      } else {
        alert("Please enter a valid array of numbers like [1,2,3]");
      }
    } catch (err) {
      alert("Invalid input.");
    }
  };

  const handlePassageLoad = () => {
    const found = Passages.find((p) => p.id === passageNumber.trim());
    if (!found) {
      alert("Passage not found.");
      return;
    }

    setPassageText(found.text);

    // Reset visible indexes to show all words initially
    const newWords = found.text.split(" ");
    setVisibleIndexes(Array.from({ length: newWords.length }, (_, i) => i));
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-1/2 flex flex-col justify-center items-center p-6 space-y-6">
        {/* Passage Input */}
        <div className="flex space-x-4 w-full max-w-lg">
          <Input
            placeholder="Enter passage number (e.g., 1, 2, 3)"
            value={passageNumber}
            onChange={(e) => setPassageNumber(e.target.value)}
          />
          <Button onClick={handlePassageLoad} className="btn-small-inverted">
            Load
          </Button>
        </div>

        {/* Poem */}
        <div className="max-w-3xl text-center leading-relaxed flex flex-wrap">
          {words.map((word, i) => {
            const isVisible = visibleIndexes.includes(i);
            return (
              <span
                key={i}
                className={`px-1 transition duration-200 ${
                  isVisible ? "text-black" : "text-transparent bg-black"
                }`}
              >
                {word + " "}
              </span>
            );
          })}
        </div>

        {/* Index Input */}
        <div className="flex space-x-4 w-full max-w-lg">
          <Input
            placeholder="Enter indexes like [1,2,3]"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button onClick={handleApply} className="btn-small-inverted">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PoemViewer;
