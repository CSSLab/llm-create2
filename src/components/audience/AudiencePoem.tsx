import type { AudiencePoem as AudiencePoemData } from "../../types";

interface Props {
  poem: AudiencePoemData;
  label?: string;
}

const AudiencePoem = ({ poem, label }: Props) => {
  const selectedIndexes = new Set(poem.selectedWordIndexes);
  const words = poem.passage.text.split(" ");

  return (
    <figure
      className="w-full rounded-xl border border-light-grey-2 bg-white p-5 shadow-sm sm:p-6"
      onCopy={(event) => event.preventDefault()}
    >
      {label ? <figcaption className="mb-4 text-h3">{label}</figcaption> : null}
      <div className="flex w-full select-none flex-wrap leading-relaxed">
        {words.map((word, index) => {
          const selected = selectedIndexes.has(index);
          return (
            <span
              key={index}
              className={`font-serif text-sm tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] sm:text-base ${
                selected
                  ? "bg-white text-black"
                  : "bg-dark-grey text-transparent"
              }`}
            >
              {word + "\u00A0"}
            </span>
          );
        })}
      </div>
    </figure>
  );
};

export default AudiencePoem;
