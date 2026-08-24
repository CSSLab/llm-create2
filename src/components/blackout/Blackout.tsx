import React, { useState } from "react";
import { Button } from "@chakra-ui/react";
import type { PoemSnapshot } from "../../types";
import { MdOutlineUndo } from "react-icons/md";
import { MdOutlineRedo } from "react-icons/md";

interface BlackoutProps {
  passageText: string;
  passageTitle?: string;
  passageAuthor?: string;
  passagePublication?: string;
  selectedWordIndexes: number[];
  setSelectedWordIndexes: React.Dispatch<React.SetStateAction<number[]>>;
  setPoemSnapshots: React.Dispatch<React.SetStateAction<PoemSnapshot[]>>;
}

const BlackoutPoetry: React.FC<BlackoutProps> = ({
  passageText,
  passageTitle,
  passageAuthor,
  passagePublication,
  selectedWordIndexes,
  setSelectedWordIndexes,
  setPoemSnapshots,
}) => {
  const words = passageText.split(" ");
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Track undo/redo position
  const [history, setHistory] = useState<PoemSnapshot[]>([]);

  const toggleSelect = (index: number) => {
    const isSelected = selectedWordIndexes.includes(index);
    const newIndexes = isSelected
      ? selectedWordIndexes.filter((i) => i !== index)
      : [...selectedWordIndexes, index];

    setSelectedWordIndexes(newIndexes);

    const newSnapshot: PoemSnapshot = {
      action: isSelected ? "REMOVE" : "ADD",
      index,
      timestamp: new Date(),
      source: "DIRECT",
    };
    setPoemSnapshots((prev) => [...prev, newSnapshot]);

    // Update history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newSnapshot]);
    setHistoryIndex((prev) => prev + 1);
  };

  const undo = () => {
    if (historyIndex < 0) return;

    const snapshot = history[historyIndex];

    setSelectedWordIndexes((prev) => {
      let newIndexes: number[];
      let actionType: "ADD" | "REMOVE";

      if (snapshot.action === "ADD") {
        newIndexes = prev.filter((i) => i !== snapshot.index);
        actionType = "REMOVE";
      } else {
        newIndexes = [...prev, snapshot.index];
        actionType = "ADD";
      }

      // Push to snapshots to record undo
      setPoemSnapshots((prevSnapshots) => [
        ...prevSnapshots,
        {
          action: actionType,
          index: snapshot.index,
          timestamp: new Date(),
          source: "UNDO",
        },
      ]);

      return newIndexes;
    });

    setHistoryIndex((prev) => prev - 1);
  };

  const redo = () => {
    if (historyIndex + 1 >= history.length) return;

    const snapshot = history[historyIndex + 1];

    setSelectedWordIndexes((prev) => {
      let newIndexes: number[];
      let actionType: "ADD" | "REMOVE";

      if (snapshot.action === "ADD") {
        newIndexes = [...prev, snapshot.index];
        actionType = "ADD";
      } else {
        newIndexes = prev.filter((i) => i !== snapshot.index);
        actionType = "REMOVE";
      }

      // Push to snapshots to record redo
      setPoemSnapshots((prevSnapshots) => [
        ...prevSnapshots,
        {
          action: actionType,
          index: snapshot.index,
          timestamp: new Date(),
          source: "REDO",
        },
      ]);

      return newIndexes;
    });

    setHistoryIndex((prev) => prev + 1);
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Top Controls */}
      <div className="w-full flex flex-row justify-between">
        <div className="flex flex-row space-x-2">
          <Button
            className="btn-small-inverted"
            onClick={undo}
            disabled={historyIndex < 0}
          >
            <MdOutlineUndo />
            <p className="hidden md:block">Undo</p>
          </Button>
          <Button
            className="btn-small-inverted"
            onClick={redo}
            disabled={historyIndex + 1 >= history.length}
          >
            <MdOutlineRedo />
            <p className="hidden md:block">Redo</p>
          </Button>
        </div>
      </div>

      {/* Two Column View */}
      <div className="mx-auto h-full overflow-auto">
        <div className="flex flex-row gap-8">
          {/* Passage Side */}
          <div
            className="flex flex-wrap select-none h-max w-[350px] min-w-[350px] md:min-w-[400px] md:w-[400px]"
            onCopy={(e) => e.preventDefault()}
          >
            {words.map((word, i) => {
              const isSelected = selectedWordIndexes.includes(i);
              const textColor = isSelected
                ? "text-main font-serif text-light-grey-1"
                : "text-main font-serif hover:text-blue-800 hover:underline";

              return (
                <span
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={` tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] cursor-pointer transition duration-200 ${textColor}`}
                >
                  {word + "\u00A0"}
                </span>
              );
            })}
            {(passageTitle || passageAuthor || passagePublication) && (
              <p className="text-xs text-grey text-left pt-2 w-full">
                {passageTitle && (
                  <span className="italic">{'"' + passageTitle + '"'}</span>
                )}
                {passageAuthor && <span>{", " + passageAuthor}</span>}
                {passagePublication && <span>{", " + passagePublication}</span>}
              </p>
            )}
          </div>

          {/* Blackout Preview Side */}
          <div
            className="flex flex-wrap select-none h-max w-[355px] min-w-[355px] md:min-w-[400px] md:w-[400px]"
            onCopy={(e) => e.preventDefault()}
          >
            {words.map((word, i) => {
              const isSelected = selectedWordIndexes.includes(i);
              const blackoutStyle = isSelected
                ? "text-main font-serif text-dark-grey"
                : "text-main font-serif text-dark-grey bg-dark-grey";

              return (
                <>
                  <span
                    key={i}
                    className={` tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200 ${blackoutStyle}`}
                  >
                    {word + "\u00A0"}
                  </span>
                </>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlackoutPoetry;
