import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../../components/shared/pages/halfPage";
import { Button, Input } from "@chakra-ui/react";
import { toaster } from "../../components/ui/toaster";
import { DataContext } from "../../App";
import { createAudienceTestAssignment } from "../../consts/audienceTestAssignment";
import { CREATOR_PASSAGE_POOL_VERSION, Passages } from "../../consts/passages";
import type { AudienceAssignment } from "../../types";

const TEST_CAPTCHA = "AUDIENCE_TEST";
const INSUFFICIENT_AUDIENCE_POOL = "INSUFFICIENT_AUDIENCE_POOL";
const AUDIENCE_PASSAGE_IDS = new Set(Passages.map((passage) => passage.id));

const isValidAssignment = (assignment: AudienceAssignment) =>
  assignment.poems.length === 4 &&
  assignment.statementTrials.length === 4 &&
  assignment.passagePoolVersion === CREATOR_PASSAGE_POOL_VERSION &&
  assignment.passageId === assignment.taskPassageId &&
  assignment.tutorialPassageId !== assignment.taskPassageId &&
  AUDIENCE_PASSAGE_IDS.has(assignment.tutorialPassageId) &&
  AUDIENCE_PASSAGE_IDS.has(assignment.taskPassageId) &&
  assignment.poems.every((poem) => poem.passageId === assignment.taskPassageId);

const Captcha = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { addUserData, prolific, setIsTestMode } = context;
  const [captchaMessage, setCaptchaMessage] = useState("");
  const [inputCaptcha, setInputCaptcha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateCaptchaCheck();
  }, []);

  const handleChange = (event: any) => setInputCaptcha(event.target.value);

  const generateCaptchaCheck = () => {
    let captcha_text = "";
    const c_chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 4; i++) {
      captcha_text += c_chars.charAt(
        Math.floor(Math.random() * c_chars.length),
      );
    }
    setCaptchaMessage(captcha_text);
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "30px Roboto"; // smaller font
        ctx.fillStyle = "black";
        ctx.fillText(captchaMessage, 8, 30); // adjusted position
        // smaller lines
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(80, 25);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(80, 15);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "black";
        ctx.stroke();
      }
    }
  }, [captchaMessage]);

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

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
      prolific: prolific ?? undefined,
    });
    navigate("/consent");
  };

  const startAudiencePreview = (description: string) => {
    setIsTestMode(true);
    toaster.create({
      description,
      type: "info",
      duration: 8000,
    });
    startAudience(createAudienceTestAssignment());
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (inputCaptcha === TEST_CAPTCHA) {
      startAudiencePreview(
        "Audience preview started with dummy poems. Preview responses will not be saved.",
      );
      return;
    }

    if (inputCaptcha !== captchaMessage) {
      toaster.create({
        description: "Captcha does not match! Try again.",
        type: "error",
        duration: 5000,
      });
      generateCaptchaCheck();
      setInputCaptcha("");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/firebase/audience-assignment", {
        method: "POST",
      });
      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => null);
        if (
          response.status === 409 &&
          typeof errorBody === "object" &&
          errorBody !== null &&
          "code" in errorBody &&
          errorBody.code === INSUFFICIENT_AUDIENCE_POOL
        ) {
          startAudiencePreview(
            "Not enough completed artist responses are available yet, so this preview is using dummy poems. Preview responses will not be saved.",
          );
          return;
        }
        throw new Error(`Assignment failed with status ${response.status}`);
      }
      const assignment = (await response.json()) as AudienceAssignment;
      if (!isValidAssignment(assignment)) {
        throw new Error("Audience assignment response was invalid");
      }
      startAudience(assignment);
    } catch (err) {
      console.error("Failed to prepare poems for study:", err);
      toaster.create({
        description:
          "Something went wrong setting up the study. Please try again.",
        type: "error",
        duration: 5000,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <HalfPageTemplate left background="bg1">
      <div className="flex flex-col w-full h-full justify-center space-y-4 p-1">
        {/* Smaller canvas */}
        <p className="text-h1">Enter Captcha</p>
        <div className="w-1/2 h-max space-y-4">
          <canvas ref={canvasRef} height="40" width="90" />
        </div>

        <Input
          className="w-full md:w-48 px-2 outline-1 outline-light-grey-2 outline focus:outline-grey focus:outline-2"
          variant="outline"
          value={inputCaptcha}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type code here"
        />
        <Button
          className="btn-primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Continue
        </Button>
      </div>
    </HalfPageTemplate>
  );
};

export default Captcha;
