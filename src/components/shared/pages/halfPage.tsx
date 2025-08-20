import type { ReactNode } from "react";
import bg1 from "../../../assets/bg1.svg";
import bg2 from "../../../assets/bg2.svg";
import bg3 from "../../../assets/bg3.svg";
import bg4 from "../../../assets/bg4.svg";
import bg5 from "../../../assets/bg5.svg";

interface PageTemplateProps {
  children?: ReactNode;

  title?: string;
  description?: string;
  background?: "bg1" | "bg2" | "bg3" | "bg4" | "bg5" | "none"; // limited options
  left?: boolean;
}

// Map of available backgrounds
const BACKGROUNDS: Record<string, string> = {
  bg1,
  bg2,
  bg3,
  bg4,
  bg5,
};

function HalfPageTemplate({
  children,
  background = "none",
  title,
  description,
  left = false,
}: PageTemplateProps) {
  return (
    <div
      className={
        `relative w-full h-full min-w-96 bg-white overflow-hidden p-16 md:p-20 ` +
        (background == "bg4" ? `bg-dark-grey` : `bg-white `)
      }
    >
      {background !== "none" && (
        <img
          src={BACKGROUNDS[background || "bg1"]}
          alt="background"
          className={
            `absolute top-0 left-0 w-full h-full object-none pointer-events-none select-none ` +
            (background == "bg5" || background == "bg1"
              ? `opacity-0 lg:opacity-100`
              : ``)
          }
          style={{
            zIndex: 0,
          }}
        />
      )}
      <div
        className={
          `relative z-10 h-full w-full lg:w-1/2 space-y-4 flex flex-col justify-between` +
          (left == undefined
            ? ` justify-self-start`
            : left
            ? ` justify-self-start`
            : ` lg:justify-self-end`)
        }
      >
        <div className={`w-full h-max space-y-4`}>
          {title && (
            <div
              className={
                `w-full h-max flex ` +
                (background == "bg4" ? `text-h1-dark` : `text-h1`)
              }
            >
              <p>{title}</p>
            </div>
          )}
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
          <div className={`w-full overflow-auto py-4 h-[70vh]`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default HalfPageTemplate;
