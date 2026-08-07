import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea, Button } from "@chakra-ui/react";
import ChatTab from "../../chatbot/Chatbot";
import type {
  ChatAvailability,
  ChatInputActivity,
  LlmRequestLog,
  Message,
  Stage,
} from "../../../types";
import type { ReactNode } from "react";

interface PageTemplateProps {
  children?: ReactNode;
  nextButton?: Button;
  title?: string;
  description?: string;
  left?: boolean;
  buttonLeft?: boolean;
  duration?: number;
  autoRedirectDuration?: number;
  buttonText?: string;
  afterDuration?: () => void;
  llmAccess?: boolean;
  chatReady?: boolean;
  stage: Stage;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  passage: string;
  selectedWordIndexes?: number[];
  initialInputActivity?: ChatInputActivity;
  onChatAvailable?: (availability: ChatAvailability) => void;
  onInputActivityUpdate?: (activity: ChatInputActivity) => void;
  onRequestUpdate?: (request: LlmRequestLog) => void;
}

interface Button {
  text: string;
  action?: () => void;
}

function MultiPageTemplate({
  children,
  title,
  description,
  duration,
  autoRedirectDuration,
  afterDuration,
  buttonText,
  llmAccess = false,
  chatReady = true,
  stage,
  messages,
  setMessages,
  notes,
  setNotes,
  selectedWordIndexes,
  passage,
  initialInputActivity,
  onChatAvailable,
  onInputActivityUpdate,
  onRequestUpdate,
}: PageTemplateProps) {
  const [leftWidth, setLeftWidth] = useState(70); // %
  const [topHeight, setTopHeight] = useState(80); // %
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdownVisible, setShowCountdownVisible] = useState(false);

  const autoRedirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const isDraggingX = useRef(false);
  const isDraggingY = useRef(false);

  const startDragX = () => {
    isDraggingX.current = true;
    document.body.style.userSelect = "none";
  };

  const startDragY = () => {
    isDraggingY.current = true;
    document.body.style.userSelect = "none";
  };

  const stopDrag = () => {
    isDraggingX.current = false;
    isDraggingY.current = false;
    document.body.style.userSelect = "auto";
  };

  useEffect(() => {
    const updateDrag = (clientX: number, clientY: number) => {
      if (isDraggingX.current) {
        const newWidth = (clientX / window.innerWidth) * 100;
        if (newWidth > 40 && newWidth < 80) setLeftWidth(newWidth);
      }
      if (isDraggingY.current) {
        const containerHeight = window.innerHeight;
        const newHeight = (clientY / containerHeight) * 100;
        if (newHeight > 10 && newHeight < 90) setTopHeight(newHeight);
      }
    };
    const handleMouseMove = (event: MouseEvent) => {
      updateDrag(event.clientX, event.clientY);
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        updateDrag(event.touches[0].clientX, event.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", stopDrag);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, []);

  const startFadeOut = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => afterDuration?.(), 500); // matches CSS duration
  }, [afterDuration]);

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
  }, [duration, isTimeUp, autoRedirectDuration, startFadeOut]);

  // timer for auto-direct
  useEffect(() => {
    return () => {
      if (autoRedirectTimeoutRef.current) {
        clearTimeout(autoRedirectTimeoutRef.current);
      }
    };
  }, []);

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
    <div className="w-full h-full min-w-96 overflow-hidden">
      <div
        className={`flex h-full w-full transform transition-all duration-1000 ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Left Panel */}
        <div
          className="flex flex-col w-full h-full bg-white"
          style={{ width: `${leftWidth}%` }}
        >
          {/* Main Content */}
          <div
            className=" overflow-auto w-full p-16 pb-8 md:px-20 md:pt-20"
            style={{ height: `${topHeight}%` }}
          >
            <div className="w-full h-max space-y-4">
              <div
                className={`w-full h-max flex text-h1 justify-between items-center flex-row text-h1`}
              >
                <p>{title}</p>
                <div className="flex flex-col items-center justify-center min-w-[10rem]">
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
              </div>

              <div
                className={`w-full h-max flex text-left text-sm font-sans text-grey`}
              >
                <p>{description}</p>
              </div>

              <div className={`w-full flex overflow-auto h-max`}>
                {children}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-1 bg-gray-300 w-10 self-center cursor-row-resize hover:bg-gray-500"
            onMouseDown={startDragY}
            onTouchStart={startDragY}
          />

          {/* Notes */}
          <div
            className="overflow-auto bg-white flex w-full p-16 pt-8 md:px-20 md:pb-20"
            style={{ height: `${100 - topHeight}%` }}
          >
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take some notes..."
              className="text-main bg-white max-h-full flex-1 px-3 py-2 border rounded-md focus:outline-none focus:border-2 focus:border-grey"
            />
          </div>
        </div>
        {llmAccess ? (
          <>
            {/* Vertical Divider */}
            <div
              className="w-1 bg-gray-300 h-10 self-center cursor-col-resize hover:bg-gray-500"
              onMouseDown={startDragX}
              onTouchStart={startDragX}
            />

            {/* Chatbot Panel */}
            <div className="flex-1 p-4 overflow-auto bg-light-grey-4">
              <ChatTab
                messages={messages}
                setMessages={setMessages}
                stage={stage}
                passage={passage}
                selectedWordIndexes={selectedWordIndexes}
                chatReady={chatReady}
                initialInputActivity={initialInputActivity}
                onChatAvailable={onChatAvailable}
                onInputActivityUpdate={onInputActivityUpdate}
                onRequestUpdate={onRequestUpdate}
              />
            </div>
          </>
        ) : (
          <>
            {/* Vertical Divider */}
            <div
              className="w-1 bg-gray-300 h-10 self-center cursor-col-resize hover:bg-gray-500"
              onMouseDown={startDragX}
              onTouchStart={startDragX}
            />

            {/* Chatbot Panel */}
            <div className="flex-1 p-4 overflow-auto bg-light-grey-4"></div>
          </>
        )}
      </div>
    </div>
  );
}

export default MultiPageTemplate;
