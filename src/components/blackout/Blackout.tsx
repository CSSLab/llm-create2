import React, { useState } from "react";
import { Button } from "@chakra-ui/react";
import { RiEyeCloseLine } from "react-icons/ri";
import { MdOutlineMenuBook } from "react-icons/md";
import { MdOutlineRestartAlt } from "react-icons/md";
import { MdContentCopy } from "react-icons/md";

interface BlackoutProps {
  onSubmit?: () => void;
  selectedWordIndexes: number[];
  setSelectedWordIndexes: React.Dispatch<React.SetStateAction<number[]>>;
}

const BlackoutPoetry: React.FC<BlackoutProps> = ({
  onSubmit,
  selectedWordIndexes,
  setSelectedWordIndexes,
}) => {
  const [passageText] = useState(
    "Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear."
  );
  const words = passageText.split(" ");
  const [viewMode, setViewMode] = useState<"edit" | "blackout">("edit");

  const copyPassage = () => {
    navigator.clipboard.writeText(passageText);
  };

  const toggleSelect = (index: number) => {
    setSelectedWordIndexes((prev) => {
      if (prev.includes(index)) {
        // Remove index
        return prev.filter((i) => i !== index);
      } else {
        // Add index
        return [...prev, index];
      }
    });
  };

  const resetSelection = () => {
    setSelectedWordIndexes([]);
  };

  return (
    <div className="w-full h-max flex flex-col space-y-6">
      <div className="w-full h-max flex flex-row justify-between">
        <div className="w-max flex flex-row space-x-2">
          <Button
            className={
              viewMode === "edit" ? "btn-small-inverted" : "btn-small bg-grey"
            }
            onClick={() =>
              setViewMode(viewMode === "edit" ? "blackout" : "edit")
            }
          >
            {viewMode === "edit" ? <RiEyeCloseLine /> : <MdOutlineMenuBook />}{" "}
            <p className="hidden md:block">
              {viewMode === "edit" ? "View as Blackout" : "View as passage"}
            </p>
          </Button>
          <Button
            className="btn-small-inverted"
            onClick={() => resetSelection()}
          >
            <MdOutlineRestartAlt />{" "}
            <p className="hidden md:block">Reset poem</p>
          </Button>
          <Button className="btn-small-inverted" onClick={() => copyPassage()}>
            <MdContentCopy />
          </Button>
        </div>

        <Button className="btn-small px-4" onClick={onSubmit}>
          Submit
        </Button>
      </div>

      <div className="py-6 leading-relaxed flex flex-wrap">
        {words.map((word, i) => {
          const isSelected = selectedWordIndexes.includes(i);

          const textColor =
            viewMode === "blackout"
              ? isSelected
                ? "text-main"
                : "text-main bg-dark-grey bg-opacity-70"
              : isSelected
              ? "text-main text-light-grey-1 underline"
              : "text-main bg-transparent";

          return (
            <span
              key={i}
              onClick={() => toggleSelect(i)}
              className={`cursor-pointer transition px-1 duration-200 ${textColor}`}
            >
              {word + ` `}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default BlackoutPoetry;
