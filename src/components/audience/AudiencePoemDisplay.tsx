import type { AudiencePoem } from "../../types";

interface Props {
  poem: AudiencePoem;
  label?: string;
  smallOnMedium?: boolean;
  fluid?: boolean;
}

// Shared blackout-poem renderer for the audience flow (poem reading,
// statement match, AI detection). Word styling matches the
// rest of this app's blackout poems exactly.
const AudiencePoemDisplay: React.FC<Props> = ({
  poem,
  label,
  smallOnMedium,
  fluid = false,
}) => {
  const words = poem.passage.text.split(" ");
  const selectedIndexes = new Set(poem.selectedWordIndexes);

  return (
    <figure
      className={`flex flex-wrap select-none h-max w-full min-w-0 ${
        fluid ? "max-w-none" : smallOnMedium ? "max-w-[350px] lg:max-w-[400px]" : "max-w-[400px]"
      }`}
      onCopy={(e) => e.preventDefault()}
    >
      {label && (
        <figcaption className="text-sub mb-3 w-full font-semibold text-dark-grey">
          {label}
        </figcaption>
      )}
      {words.map((word, i) => {
        const isVisible = selectedIndexes.has(i);
        return (
          <span
            key={i}
            // Retain word geometry for the artwork, but keep removed words
            // out of the accessibility tree and obscured in forced colors.
            aria-hidden={!isVisible}
            className={`text-main font-serif tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200 ${
              isVisible
                ? "text-black bg-white"
                : "text-transparent bg-dark-grey [forced-color-adjust:none]"
            } ${smallOnMedium ? "md:text-sm xl:text-base" : ""}`}
          >
            {word + " "}
          </span>
        );
      })}
    </figure>
  );
};

export default AudiencePoemDisplay;
