import React, { useState } from "react";
import { Input, Button } from "@chakra-ui/react";

const PoemViewer: React.FC = () => {
  const [passageText] = useState(
    "Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear."
  );

  const words = passageText.split(" ");

  const [inputValue, setInputValue] = useState("");
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>(
    Array.from({ length: words.length }, (_, i) => i)
  );

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

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-1/2 flex flex-col justify-center items-center p-6 space-y-6">
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

        {/* Input + Button */}
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
