import React from "react";
import type { LikertScaleQuestion } from "../../../types";
import { RadioGroup } from "@chakra-ui/react";

interface Props {
  question: LikertScaleQuestion;
  value: number | null | undefined;
  onChange: (id: string, value: number) => void;
}

const LikertScale: React.FC<Props> = ({ question, value, onChange }) => {
  return (
    <div className="mb-4 space-y-4">
      <p
        className={
          `text-main h-max` + (question.sideTitle ? " block md:hidden" : "")
        }
      >
        {question.question}
        {question.required && <span className="text-red-700">*</span>}
      </p>

      <RadioGroup.Root
        value={value != null ? value.toString() : ""}
        onValueChange={(e) => onChange(question.id, parseInt(e.value!, 10))}
        className="w-full"
      >
        <div
          className={
            `flex w-full flex-row md:items-center md:justify-around ` +
            (question.doNotCollapse ? " items-center justify-around" : "")
          }
        >
          <div
            className={
              `
            flex flex-col gap-3 mb-1 w-full min-w-0
            md:grid md:gap-6
          ` + (question.doNotCollapse ? " flex-row grid gap-6" : "")
            }
            style={{
              gridTemplateColumns: `repeat(${
                question.options.length + (question.sideTitle ? 1 : 0)
              }, minmax(0, 1fr))`,
            }}
          >
            <div
              className={
                `text-sub  ` +
                (question.sideTitle
                  ? " hidden h-0 md:block md:h-full w-full md:w-24 lg:w-32 text-left "
                  : " hidden ")
              }
            >
              {!question.removeValues && (
                <div className="h-0 md:h-10 md:mb-3"></div>
              )}
              <div className="flex items-center w-full">
                <p>
                  {question.question}
                  {question.required && <span className="text-red-700">*</span>}
                </p>
              </div>
            </div>
            {question.options.map((opt) => (
              <div
                key={opt.value}
                className={
                  `
                /* mobile layout: horizontal row */

                /* desktop layout: stacked column */
                min-w-0 md:flex md:flex-col md:items-center md:text-center md:justify-center h-full
              ` +
                  (question.doNotCollapse
                    ? " items-center flex flex-col text-center md:justify-center"
                    : " flex items-center gap-3 text-left ")
                }
              >
                {/* Radio */}
                <RadioGroup.Item
                  value={opt.value.toString()}
                  className="cursor-pointer flex-shrink-0 flex items-center justify-center md:justify-self-center"
                >
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator className="border border-light-grey-1  rounded-full w-4 h-4 focus:border-grey focus:border-2" />
                </RadioGroup.Item>

                {/* Label */}
                <span
                  className={
                    `
                  text-sub break-words min-w-0
                  /* desktop: label above */
                  md:max-w-24 md:order-first md:mb-1 md:min-h-10 md:flex md:items-start md:justify-center md:text-center
                ` + (question.removeValues ? "block md:hidden " : "")
                  }
                >
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </RadioGroup.Root>
    </div>
  );
};

export default LikertScale;
