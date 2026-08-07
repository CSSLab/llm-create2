import type { AudiencePoem } from "../../types";

interface Props {
  poem: AudiencePoem;
  label?: string;
  smallOnMedium?: boolean;
}

// Shared blackout-poem renderer for the audience flow (poem reading,
// statement match, creativity, AI detection). Word styling matches the
// rest of this app's blackout poems exactly.
const AudiencePoemDisplay: React.FC<Props> = ({
  poem,
  label,
  smallOnMedium,
}) => {
  const words = poem.passage.text.split(" ");
  const selectedIndexes = new Set(poem.selectedWordIndexes);

  return (
    <figure
      className={`flex flex-wrap select-none h-max ${
        smallOnMedium
          ? "w-[350px] min-w-[350px] md:min-w-[350px] md:w-[350px] lg:min-w-[400px] lg:w-[400px]"
          : "w-[350px] min-w-[350px] md:min-w-[400px] md:w-[400px]"
      }`}
      onCopy={(e) => e.preventDefault()}
    >
      {label && (
        <figcaption className="text-sub font-semibold mb-2 w-full">
          {label}
        </figcaption>
      )}
      {words.map((word, i) => {
        const isVisible = selectedIndexes.has(i);
        return (
          <span
            key={i}
            className={`text-main font-serif tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200 ${
              isVisible
                ? "text-black bg-white"
                : "text-transparent bg-dark-grey"
            } ${smallOnMedium ? "md:text-sm lg:text-base" : ""}`}
          >
            {word + " "}
          </span>
        );
      })}
      <figcaption className="text-xs text-grey text-left pt-2 w-full">
        <span className="italic">{'"' + poem.passage.title + '"'}</span>
        <span>{", " + poem.passage.author}</span>
      </figcaption>
    </figure>
  );
};

export default AudiencePoemDisplay;
