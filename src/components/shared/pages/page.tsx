import type { ReactNode } from "react";
import bg1 from "../../../assets/bg1.svg";
import bg2 from "../../../assets/bg2.svg";
import bg3 from "../../../assets/bg3.svg";
import bg4 from "../../../assets/bg4.svg";
import bg5 from "../../../assets/bg8.svg";
import { Button } from "@chakra-ui/react";

interface PageTemplateProps {
  children?: ReactNode;
  nextButton?: Button;
  title?: string;
  description?: string;
  background?: "bg1" | "bg2" | "bg3" | "bg4" | "bg5" | "none"; // limited options
  left?: boolean;
  duration?: number;
  afterDuration?: () => void;
  timerComponent?: ReactNode;
}

interface Button {
  text: String;
  action?: () => void;
}

// Map of available backgrounds
const BACKGROUNDS: Record<string, string> = {
  bg1,
  bg2,
  bg3,
  bg4,
  bg5,
};

function PageTemplate({
  children,
  background = "none",
  title,
  description,
  left = undefined,
  nextButton = undefined,
  timerComponent,
}: PageTemplateProps) {
  return (
    <div
      className={
        `relative w-full h-full min-w-96 overflow-hidden p-10 md:p-20` +
        (background == "bg4" || background == "bg5"
          ? ` bg-dark-grey`
          : ` bg-white `)
      }
    >
      {/* Background SVG overlay */}
      {background !== "none" && (
        <img
          src={BACKGROUNDS[background || "bg1"]}
          alt="background"
          className={
            `absolute bottom-0 right-0 w-screen h-screen object-none pointer-events-none select-none ` +
            (background == "bg2" || background == "bg1"
              ? `opacity-0 md:opacity-100`
              : ``)
          }
          style={{
            zIndex: 0,
          }}
        />
      )}
      <div className="relative z-10 h-full w-full space-y-4 flex flex-col justify-between  ">
        <div className="w-full h-max space-y-4">
          {title && (
            <div
              className={
                `w-full h-max flex text-h1 justify-between items-center flex-row ` +
                (background == "bg4" || background == "bg5"
                  ? `text-h1-dark`
                  : `text-h1`)
              }
            >
              <p>{title}</p>
              {timerComponent}
            </div>
          )}
          {description && (
            <div
              className={
                `w-full h-max flex text-left text-grey ` +
                (background == "bg4" || background == "bg5"
                  ? `text-main-dark`
                  : `text-main`)
              }
            >
              <p>{description}</p>
            </div>
          )}
          <div
            className={
              `w-full overflow-y-auto py-4` +
              (title ? ` h-[60vh]` : ` h-[50vh] md:h-[70vh]`)
            }
          >
            {children}
          </div>
        </div>
        {nextButton && (
          <div
            className={
              `h-48 w-full flex items-center md:items-start` +
              (left == undefined
                ? ` justify-center`
                : left
                ? ` justify-start`
                : ` justify-end`)
            }
          >
            <Button className="btn-primary" onClick={nextButton.action}>
              {nextButton.text}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PageTemplate;
