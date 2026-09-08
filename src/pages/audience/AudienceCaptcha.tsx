import { useState, useEffect, useRef, useContext } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../../components/shared/pages/halfPage";
import { Button, Input } from "@chakra-ui/react";
import { toaster } from "../../components/ui/toaster";
import { DataContext } from "../../App";
import { createAudienceTestAssignment } from "../../consts/audienceTestAssignment";
import type { AudienceAssignment, InterpretationCondition } from "../../types";
import { isValidAudienceAssignment } from "../../../server/api/utils/audienceAssignment";

const TEST_CAPTCHA = "AUDIENCE_TEST";
const PREVIEW_CODES = ["AUDIENCE_PREVIEW", "AUDIENCE_PREVIEW_AI", "AUDIENCE_PREVIEW_NO_AI"];

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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => setInputCaptcha(event.target.value);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
          id: "audience-survey-v4",
          poemAnswers: [],
          statementMatches: [],
          creativityRatings: [],
          aiLikelihoodRatings: [],
          interpretationExposures: [],
          postAnswers: {},
        },
        timeStamps: [new Date()],
      },
      prolific: prolific ?? undefined,
    });
    navigate("/consent");
  };

  const startAudiencePreview = (description: string, condition?: InterpretationCondition) => {
    setIsTestMode(true);
    toaster.create({
      description,
      type: "info",
      duration: 8000,
    });
    startAudience(createAudienceTestAssignment(condition));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if ([TEST_CAPTCHA, "AUDIENCE_TEST_AI", "AUDIENCE_TEST_NO_AI"].includes(inputCaptcha)) {
      startAudiencePreview(
        "Audience preview started with dummy poems. Preview responses will not be saved.",
        inputCaptcha === "AUDIENCE_TEST_AI" ? "AI" : inputCaptcha === "AUDIENCE_TEST_NO_AI" ? "NO_AI" : undefined,
      );
      return;
    }

    const realPreview = PREVIEW_CODES.includes(inputCaptcha);
    if (!realPreview && inputCaptcha !== captchaMessage) {
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
      const response = await fetch(realPreview ? "/api/firebase/audience-preview-assignment" : "/api/firebase/audience-assignment", {
        method: "POST",
        ...(realPreview && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interpretationCondition: inputCaptcha === "AUDIENCE_PREVIEW_AI" ? "AI"
            : inputCaptcha === "AUDIENCE_PREVIEW_NO_AI" ? "NO_AI" : undefined }),
        }),
      });
      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => null);
        if (typeof errorBody === "object" && errorBody !== null &&
            "code" in errorBody && ["AUDIENCE_INTERPRETATIONS_NOT_READY", "AUDIENCE_PILOT_NOT_READY", "INSUFFICIENT_AUDIENCE_POOL"].includes(String(errorBody.code))) {
          toaster.create({
            description: "The study is not ready yet. Please contact the study administrator.",
            type: "error",
            duration: 8000,
          });
          setIsSubmitting(false);
          return;
        }
        throw new Error(`Assignment failed with status ${response.status}`);
      }
      const assignment = (await response.json()) as AudienceAssignment;
      if (!isValidAudienceAssignment(assignment) || !!assignment.preview !== realPreview) {
        throw new Error("Audience assignment response was invalid");
      }
      setIsTestMode(realPreview);
      if (realPreview) {
        toaster.create({ description: "Previewing the pilot's existing poems. Preview responses will not be saved.", type: "info", duration: 8000 });
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
