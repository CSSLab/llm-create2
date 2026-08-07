import type { ReactNode } from "react";
import bg1 from "../../../../assets/bg1.svg";
import bg2 from "../../../../assets/bg2.svg";
import bg3 from "../../../../assets/bg3.svg";
import bg4 from "../../../../assets/bg4.svg";
import bg5 from "../../../../assets/bg8.svg";
import { Button } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
interface PageTemplateProps {
  children?: ReactNode;
  nextButton?: Button;
  title?: string;
  description?: string;
  background?: "bg1" | "bg2" | "bg3" | "bg4" | "bg5" | "none"; // limited options
  left?: boolean;
  duration?: number;
  autoRedirectDuration?: number;
  buttonText?: string;
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
  buttonText,

  autoRedirectDuration,
  duration,
  afterDuration,
}: PageTemplateProps) {
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdownVisible, setShowCountdownVisible] = useState(false);
  const [_, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const autoRedirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const startFadeOut = () => {
    setIsVisible(false);
    setTimeout(() => afterDuration?.(), 500); // matches CSS duration
  };

  useEffect(() => {
    // fade in on mount
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // timer for showing the continue button
  useEffect(() => {
    if (duration && !isTimeUp && autoRedirectDuration) {
      const startTime = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const percentageElapsed = Math.min((elapsed / duration) * 100, 100);
        setProgress(percentageElapsed);

        if (percentageElapsed >= 100) {
          setIsTimeUp(true);
          clearInterval(timerRef.current!);

          setCountdown(autoRedirectDuration);
          countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev && prev > 1) return prev - 1;
              clearInterval(countdownRef.current!);
              return 0;
            });
          }, 1000);

          setTimeout(() => setShowCountdownVisible(true), 30);

          autoRedirectTimeoutRef.current = setTimeout(() => {
            startFadeOut();
          }, autoRedirectDuration * 1000);
        }
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duration, isTimeUp, afterDuration, autoRedirectDuration]);

  const handleContinueClick = () => {
    if (autoRedirectTimeoutRef.current) {
      clearTimeout(autoRedirectTimeoutRef.current);
    }
    startFadeOut();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      className={
        `relative w-full grid h-full min-w-96 overflow-y-auto p-10 md:p-20 md:px-16 lg:px-32` +
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
        <div className="w-full h-full space-y-4">
          {title && (
            <div
              className={
                `w-full h-max flex text-h1 justify-between items-center flex-row sticky ` +
                (background == "bg4" || background == "bg5"
                  ? `text-h1-dark`
                  : `text-h1`)
              }
            >
              <p>{title}</p>
              {buttonText && (
                <>
                  <div className="flex flex-col hidden md:block items-center justify-center min-w-[10rem]">
                    <Button
                      className={`btn-small px-4 text-center ${
                        !isTimeUp ? "pointer-events-none opacity-50" : ""
                      } font-sans`}
                      onClick={handleContinueClick}
                      disabled={!isTimeUp}
                      style={{
                        background: `linear-gradient(to right, #2F2F2F ${progress}%, #B3B3B3 ${progress}%)`,
                      }}
                    >
                      {buttonText}
                    </Button>

                    <div className="h-4 mt-2 pt-2 flex items-center justify-center">
                      {isTimeUp && countdown !== null && (
                        <p
                          className={`text-xs text-gray-500 text-center transition-opacity duration-700 ease-out
                        ${showCountdownVisible ? "opacity-100" : "opacity-0"}`}
                        >
                          Tap "{buttonText}" or <br /> continue in{" "}
                          {formatTime(countdown)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col block md:hidden items-center justify-center min-w-[10rem]">
                    <Button
                      className={`btn-small px-4 text-center ${
                        !isTimeUp ? "pointer-events-none opacity-50" : ""
                      } font-sans`}
                      onClick={handleContinueClick}
                      disabled={!isTimeUp}
                      style={{
                        background: `linear-gradient(to right, #2F2F2F ${progress}%, #B3B3B3 ${progress}%)`,
                      }}
                    >
                      {"Next"}
                    </Button>
                  </div>
                </>
              )}

              {timerComponent && timerComponent}
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
            className={`w-full h-full max-h-lh flex flex-col justify-between `}
          >
            {children}

            {nextButton && (
              <div
                className={
                  ` w-full pb-20 flex h-max ` +
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
      </div>
    </div>
  );
}

export default PageTemplate;
