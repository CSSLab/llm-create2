import { Button, Input } from "@chakra-ui/react";
import { useContext, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../App";
import HalfPageTemplate from "../../components/shared/pages/halfPage";
import { toaster } from "../../components/ui/toaster";
import { createAudienceTestAssignment } from "../../consts/audienceTestAssignment";
import {
  CREATOR_PASSAGE_POOL_VERSION,
  Passages,
} from "../../consts/passages";
import type { AudienceAssignment } from "../../types";

const TEST_CAPTCHA = "AUDIENCE_TEST";
const AUDIENCE_PASSAGE_IDS = new Set(Passages.map((passage) => passage.id));

const AudienceCaptcha = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { addUserData, setIsTestMode } = context;
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaMessage, setCaptchaMessage] = useState("");
  const [inputCaptcha, setInputCaptcha] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const generateCaptcha = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let nextCaptcha = "";
    for (let index = 0; index < 4; index += 1) {
      nextCaptcha += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    setCaptchaMessage(nextCaptcha);
  };

  useEffect(() => generateCaptcha(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const drawingContext = canvas?.getContext("2d");
    if (!canvas || !drawingContext) return;

    drawingContext.clearRect(0, 0, canvas.width, canvas.height);
    drawingContext.font = "30px Roboto";
    drawingContext.fillStyle = "black";
    drawingContext.fillText(captchaMessage, 8, 30);
    drawingContext.beginPath();
    drawingContext.moveTo(0, 25);
    drawingContext.lineTo(80, 25);
    drawingContext.moveTo(0, 20);
    drawingContext.lineTo(80, 15);
    drawingContext.lineWidth = 1.5;
    drawingContext.strokeStyle = "black";
    drawingContext.stroke();
  }, [captchaMessage]);

  const startAudience = (assignment: AudienceAssignment) => {
    addUserData({
      role: "audience",
      data: {
        assignment,
        surveyResponse: {
          id: "audience-survey-v1",
          poemAnswers: [],
          statementMatches: [],
          creativityRatings: [],
          aiLikelihoodRatings: [],
          postAnswers: {},
        },
        timeStamps: [new Date()],
      },
    });
    navigate("/consent");
  };

  const handleSubmit = async () => {
    if (isAssigning) return;

    if (inputCaptcha === TEST_CAPTCHA) {
      setIsTestMode(true);
      startAudience(createAudienceTestAssignment());
      return;
    }

    if (inputCaptcha !== captchaMessage) {
      toaster.create({
        description: "Captcha does not match! Try again.",
        type: "error",
        duration: 5000,
      });
      generateCaptcha();
      setInputCaptcha("");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch("/api/firebase/audience-assignment", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Assignment failed with status ${response.status}`);
      }
      const assignment = (await response.json()) as AudienceAssignment;
      if (
        assignment.poems.length !== 4 ||
        assignment.statementTrials.length !== 4 ||
        assignment.passagePoolVersion !== CREATOR_PASSAGE_POOL_VERSION ||
        assignment.passageId !== assignment.taskPassageId ||
        assignment.tutorialPassageId === assignment.taskPassageId ||
        !AUDIENCE_PASSAGE_IDS.has(assignment.tutorialPassageId) ||
        !AUDIENCE_PASSAGE_IDS.has(assignment.taskPassageId) ||
        assignment.poems.some(
          (poem) => poem.passageId !== assignment.taskPassageId,
        )
      ) {
        throw new Error("Audience assignment response was invalid");
      }
      startAudience(assignment);
    } catch (error) {
      console.error("Audience assignment failed", error);
      toaster.create({
        description:
          "We could not prepare the poems for this session. Please try again.",
        type: "error",
        duration: 5000,
      });
      setIsAssigning(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") void handleSubmit();
  };

  return (
    <HalfPageTemplate left background="bg1">
      <div className="flex h-full w-full flex-col justify-center space-y-4 p-1">
        <p className="text-h1">Enter Captcha</p>
        <canvas ref={canvasRef} height="40" width="90" />
        <Input
          className="w-full px-2 outline outline-1 outline-light-grey-2 focus:outline-2 focus:outline-grey md:w-48"
          value={inputCaptcha}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setInputCaptcha(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={isAssigning}
          placeholder="Type code here"
        />
        <Button
          className="btn-primary"
          onClick={() => void handleSubmit()}
          disabled={isAssigning}
        >
          {isAssigning ? "Preparing poems…" : "Continue"}
        </Button>
      </div>
    </HalfPageTemplate>
  );
};

export default AudienceCaptcha;
