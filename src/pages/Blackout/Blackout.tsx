import { useState } from "react";

const SAMPLE_TEXT = `Blackout poetry is a form of found poetry where the poet takes a page of text and blacks out a majority of the words, leaving only a select few visible to create a poem.`;

const BlackoutPoetry = () => {
  const words = SAMPLE_TEXT.split(" ");
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const toggleWord = (index: number) => {
    setSelectedIndices((prev: number[]) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="flex flex-row h-full w-full md:w-max grid grid-cols-2 gap-6 min-h-screen bg-gray-100 text-left content-center min-w-sm">
      {/* Text Selection Side */}
      <div className="p-4 content-center w-full md:w-96 h-max">
        <p className="leading-relaxed">
          {words.map((word, index) => {
            const isSelected = selectedIndices.includes(index);
            return (
              <span>
                <span
                key={index}
                onClick={() => toggleWord(index)}
                className={`cursor-pointer transition-colors duration-300 px-1 ${
                  isSelected ? "text-gray-400 underline" : "text-black hover:text-gray-400"
                }`}
              >
                {word}
              </span>
                {" "}
              </span>
            );
          })}
        </p>
       
      </div>

      {/* Poem Output Side */}
      <div className="p-4 content-center  w-full md:w-96 h-max">
        <p className="leading-relaxed">
          {words.map((word, index) => {
            const isSelected = selectedIndices.includes(index);
            return (
              <span
                key={index}
                className={`px-1 transition-colors duration-300 ${
                  isSelected ? "text-black bg-transparent" : "text-black bg-black"
                }`}
              >
                {word + " "}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
};

export default BlackoutPoetry;
