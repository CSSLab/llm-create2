import { useState, useRef, useEffect } from "react";
import { Textarea } from "@chakra-ui/react";
import StarTimer from "../starTimer";
import ChatTab from "../../chatbot/Chatbot";
import type { Message, Stage } from "../../../types";
import type { ReactNode } from "react";

import { Button } from "@chakra-ui/react";

interface PageTemplateProps {
  children?: ReactNode;
  nextButton?: Button;
  title?: string;
  description?: string;
  left?: boolean;
  buttonLeft?: boolean;
  duration?: number;
  afterDuration?: () => void;
  llmAccess?: boolean;
  stage: Stage;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
}

interface Button {
  text: String;
  action?: () => void;
}

function MultiPageTemplate({
  children,
  title,
  description,
  duration = undefined,
  afterDuration,
  llmAccess = false,
  stage,
  messages,
  setMessages,
  notes,
  setNotes,
}: PageTemplateProps) {
  const [leftWidth, setLeftWidth] = useState(70); // %
  const [topHeight, setTopHeight] = useState(70); // %
  //   const [isChatOpen, setIsChatOpen] = useState(false); // mobile toggle

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

  const handleMouseMove = (e: MouseEvent) => {
    updateDrag(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      updateDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const stopDrag = () => {
    isDraggingX.current = false;
    isDraggingY.current = false;
    document.body.style.userSelect = "auto";
  };

  useEffect(() => {
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

  return (
    <div className="w-full h-full min-w-96 overflow-hidden">
      {/* Desktop Layout */}
      <div className="flex h-full w-full">
        {/* Left Panel */}
        <div
          className="flex flex-col w-full h-full bg-white"
          style={{ width: llmAccess ? `${leftWidth}%` : `100%` }}
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
                {duration && (
                  <StarTimer duration={duration} onComplete={afterDuration} />
                )}
              </div>

              <div
                className={`w-full h-max flex text-left text-sm font-sans text-grey`}
              >
                <p>{description}</p>
              </div>

              <div className={`w-full flex overflow-auto py-4 h-max`}>
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
        {llmAccess && (
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
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MultiPageTemplate;
