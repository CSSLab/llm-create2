import type { AudiencePoem } from "../../types";

interface Props {
  poem: AudiencePoem;
  label?: string;
  smallOnMedium?: boolean;
}

// Shared blackout-poem renderer for the audience flow (poem reading,
// statement match, AI detection). Word styling matches the
// rest of this app's blackout poems exactly. Width is fixed (not fluid),
// same as the artist side's blackout poem (src/components/shared/pages/poemPage.tsx
// on main) - it should render at the same size regardless of its container.
const AudiencePoemDisplay: React.FC<Props> = ({
  poem,
  label,
  smallOnMedium,
}) => {
  const words = poem.passage.text.split(" ");
  const selectedIndexes = new Set(poem.selectedWordIndexes);

  return (
    <figure
      className={`flex mx-auto flex-wrap select-none h-max w-[350px] min-w-[350px]  ${
        smallOnMedium
          ? "md:w-[350px] md:min-w-[350px]"
          : "md:w-[400px] md:min-w-[400px]"
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
            } ${smallOnMedium ? "md:text-sm" : ""}`}
          >
            {word + " "}
          </span>
        );
      })}
    </figure>
  );
};

export default AudiencePoemDisplay;
