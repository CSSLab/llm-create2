import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

const predefinedPoems = [
  {
    id: 1,
    passage: `The wind whispers over hollow bones and buried wishes`,
    selectedIndexes: [1, 2, 4, 5],
  },
  {
    id: 2,
    passage: `Beneath shadows, the moon remembers names we forget`,
    selectedIndexes: [0, 3, 5, 6],
  },
  {
    id: 3,
    passage: `The silence stretched until it became a song of stars`,
    selectedIndexes: [1, 2, 5, 7],
  },
];

const renderBlackout = (
  poemid: number,
  passage: string,
  selectedIndexes: number[],
  onClick: () => void
) => {
  const words = passage.split(" ");
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white text-main rounded-lg w-full p-4 border border-light-grey-2 text-base flex flex-col space-y-2 transition hover:border-grey hover:ring-1 hover:ring-grey"
    >
      <div className="text-h1 text-lg">Poem {poemid}</div>
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

const AudienceStep1: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate("/audience/step-2");
  };
  const [revealedPoems, setRevealedPoems] = useState<number[]>([1, 2, 3]);

  const togglePoemReveal = (id: number) => {
    setRevealedPoems((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <PageTemplate
      background="bg3"
      title="Step 1: Read"
      description="Take this time to familiarize yourself with the poems and form thoughts. Click on each poem to open and close it."
      duration={240}
      afterDuration={handleSubmit}
    >
      <div className="justify-self-center grid grid-cols-1 h-max md:h-full sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
        {predefinedPoems.map((poem) => (
          <div key={poem.id} className="flex justify-center w-full">
            {revealedPoems.includes(poem.id) ? (
              renderBlackout(poem.id, poem.passage, poem.selectedIndexes, () =>
                togglePoemReveal(poem.id)
              )
            ) : (
              <div
                onClick={() => togglePoemReveal(poem.id)}
                className="flex flex-col w-full h-max space-y-4 items-center hover:opacity-40"
              >
                <div className="w-8 h-8 relative">
                  <svg
                    className="fill-dark-grey w-full h-full"
                    viewBox="0 0 92 106"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M46 0L56.1221 35.468L91.8993 26.5L66.2442 53L91.8993 79.5L56.1221 70.532L46 106L35.8779 70.532L0.100655 79.5L25.7558 53L0.100655 26.5L35.8779 35.468L46 0Z" />
                  </svg>
                </div>
                <div className="text-h1 text-lg text-dark-grey">
                  Poem {poem.id}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </PageTemplate>
  );
};

export default AudienceStep1;
