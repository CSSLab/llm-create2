import React, { useState } from "react";
import type { MultipleChoiceQuestion } from "../../../types";
import { RadioGroup } from "@chakra-ui/react";

interface Props {
  question: MultipleChoiceQuestion;
  value: string;
  onChange: (id: string, value: string) => void;
}

const MultipleChoice: React.FC<Props> = ({ question, value, onChange }) => {
  // Radio items are keyed/valued by index rather than option text: options
  // (e.g. shuffled statements) can repeat identical text, and matching by
  // text would highlight every option that shares that text. The clicked
  // index is tracked directly rather than re-derived from `value` on every
  // render — re-deriving via indexOf() always resolves to the *first*
  // option with that text, which would make every other duplicate appear
  // unclickable (clicking one always re-highlights the first match).
  const [selectedIndex, setSelectedIndex] = useState<number>(() =>
    value ? question.options.indexOf(value) : -1,
  );

  // Only re-derive from `value` when our current selection no longer
  // matches it (e.g. the answer was reset or restored from saved state
  // outside of this component).
  if (question.options[selectedIndex] !== (value || undefined)) {
    const restored = value ? question.options.indexOf(value) : -1;
    if (restored !== selectedIndex) {
      setSelectedIndex(restored);
    }
  }

  return (
    <div className="mb-4 w-full flex flex-col space-y-4">
      <div className="flex justify-start w-full">
        <p className="text-main">
          {" "}
          {question.question}
          <span className="text-red-700">{question.required ? "*" : ""}</span>
        </p>
        {question.children && (
          <div className="ml-2">
            <CollapsibleChildren childrenNode={question.children} />
          </div>
        )}
      </div>

      <RadioGroup.Root
        value={selectedIndex === -1 ? "" : String(selectedIndex)}
        onValueChange={(e) => {
          const index = Number(e.value);
          setSelectedIndex(index);
          onChange(question.id, question.options[index]);
        }}
        className="flex flex-col gap-4 font-light"
      >
        {question.options.map((opt, i) => (
          <RadioGroup.Item
            key={i}
            value={String(i)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <RadioGroup.ItemHiddenInput />
            <RadioGroup.ItemIndicator className="border border-light-grey-1 focus:border-grey focus:border-2" />
            <RadioGroup.ItemText className="text-sub font-light">
              {opt}
            </RadioGroup.ItemText>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
};

export default MultipleChoice;

const CollapsibleChildren: React.FC<{ childrenNode: React.ReactNode }> = ({
  childrenNode,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-2 w-full">
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="text-xs text-grey underline hover:opacity-70"
      >
        {expanded ? "Close Poem" : "Show Poem"}
      </button>
      {expanded && <div className="mt-2 ">{childrenNode}</div>}
    </div>
  );
};
