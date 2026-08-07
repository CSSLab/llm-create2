import type { ReactNode } from "react";
import type { Poem } from "../../../types";

interface PageTemplateProps {
  children?: ReactNode;

  title?: string;
  description?: string;
  background?: "bg1" | "bg2" | "bg3" | "bg4" | "bg5" | "none"; // limited options
  left?: boolean;
  poem?: Poem;
}

function PoemPageTemplate({
  children,
  background = "none",
  description,
  poem,
}: PageTemplateProps) {
  const words = poem ? poem.passage.text.split(" ") : [];
  const visibleIndexes = poem ? poem.text : [];
  return (
    <div className="h-full w-full overflow-hidden bg-white p-6 sm:p-10 md:p-20">
      <div className="grid h-full w-full grid-cols-1 gap-y-10 overflow-auto md:grid-cols-2 md:gap-x-16 md:gap-y-0 md:overflow-hidden">
        {poem ? (
          <div className="flex h-max flex-wrap content-center justify-center rounded-xl bg-white pb-4 text-center leading-relaxed md:h-[70vh]">
            <div className="flex h-max w-full max-w-lg flex-wrap justify-center overflow-auto bg-white text-center leading-relaxed">
              <div
                className="flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] h-max "
                onCopy={(e) => e.preventDefault()}
              >
                <div className="w-full text-h2 mb-4 flex flex-row items-center justify-items-center">
                  <div className="w-6 h-6 mr-2">
                    <svg viewBox="0 0 92 106" className="w-full h-full">
                      <path
                        fill="#2F2F2F"
                        d="M46 0L56.1221 35.468L91.8993 26.5L66.2442 53L91.8993 79.5L56.1221 70.532L46 106L35.8779 70.532L0.100655 79.5L25.7558 53L0.100655 26.5L35.8779 35.468L46 0Z"
                      />
                    </svg>
                  </div>
                  <p className="text-h2"> Your Final Poem</p>
                </div>
                {words.map((word, i) => {
                  const isVisible = visibleIndexes.includes(i);
                  const blackoutStyle = isVisible
                    ? "text-main text-sm font-serif text-dark-grey"
                    : "text-main text-sm font-serif text-dark-grey bg-dark-grey";

                  return (
                    <span
                      key={i}
                      className={`tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200 ${blackoutStyle}`}
                    >
                      {word + "\u00A0"}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div></div>
        )}

        <div className={`h-full w-full space-y-4 flex flex-col`}>
          <div className={`w-full h-max space-y-4`}>
            {description && (
              <div
                className={
                  `w-full h-max flex text-left font-sans font text-grey ` +
                  (background == "bg4" ? `text-main-dark` : `text-main`)
                }
              >
                <p>{description}</p>
              </div>
            )}
            <div className={`w-full py-4 md:h-[70vh]`}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoemPageTemplate;
