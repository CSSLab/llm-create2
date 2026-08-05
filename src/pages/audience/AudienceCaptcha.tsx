import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../../components/shared/pages/halfPage";
import { Button, Input } from "@chakra-ui/react";
import { toaster } from "../../components/ui/toaster";
import { DataContext } from "../../App";
import { AudienceCondition } from "../../types";
const TEST_CAPTCHA = "*TEST";
const WITH_AI_TEST = "WITH_AI_TEST";
const WITHOUT_AI_TEST = "WITHOUT_AI_TEST";
const NUM_POEMS_PER_CONDITION = 2;

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Fetch the poems the audience member will see, and (if applicable)
// their AI overviews, once up front so they stay fixed for the study.
// Always picks 2 LLM-assisted poems and 2 NO_AI poems.
const fetchPoemsAndOverviews = async (condition: AudienceCondition) => {
  const res = await fetch("/api/firebase/audience-poems");
  const data = await res.json();
  const allPoems: any[] = data.poems ?? [];

  const llmPoems = shuffle(allPoems.filter((p) => p.condition === "LLM"));
  const noAiPoems = shuffle(allPoems.filter((p) => p.condition === "NO_AI"));

  const poems = shuffle([
    ...llmPoems.slice(0, NUM_POEMS_PER_CONDITION),
    ...noAiPoems.slice(0, NUM_POEMS_PER_CONDITION),
  ]);

  if (condition !== AudienceCondition.WITH_AI_OVERVIEW) {
    return { poems, overviews: {} as Record<string, string> };
  }

  const entries = await Promise.all(
    poems.map(async (poem) => {
      // NO_AI poems don't get an AI overview
      if (poem.condition === "NO_AI") {
        return [poem.id, ""] as const;
      }

      const checkRes = await fetch(`/api/firebase/poem-overview/${poem.id}`);
      const checkData = await checkRes.json();
      if (checkData.overview) {
        return [poem.id, checkData.overview] as const;
      }

      try {
        const genRes = await fetch("/api/llm/generate-overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passageText: poem.passage?.text,
            selectedWordIndexes: poem.text,
          }),
        });
        const genData = await genRes.json();
        const overview = genData.overview ?? "";
        await fetch(`/api/firebase/poem-overview/${poem.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overview }),
        });
        return [poem.id, overview] as const;
      } catch (err) {
        console.error("Failed to generate overview:", err);
        return [poem.id, ""] as const;
      }
    }),
  );

  return {
    poems,
    overviews: Object.fromEntries(entries) as Record<string, string>,
  };
};

const Captcha = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addUserData, addRoleSpecificData, prolific } = context;
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

  // TEMP: only assign the no-AI condition for now
  const randomCondition = (): AudienceCondition =>
    AudienceCondition.WITHOUT_AI_OVERVIEW;

  const completeCaptcha = async (condition: AudienceCondition) => {
    setIsSubmitting(true);
    try {
      const { poems, overviews } = await fetchPoemsAndOverviews(condition);
      addUserData({ role: "audience" });
      addRoleSpecificData({
        condition,
        poems,
        overviews,
        prolific: prolific ?? undefined,
        timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
      });
      navigate("/consent");
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

  const handleSubmit = () => {
    if (isSubmitting) return;

    if (inputCaptcha === captchaMessage || inputCaptcha === TEST_CAPTCHA) {
      completeCaptcha(randomCondition());
    } else if (inputCaptcha === WITH_AI_TEST) {
      completeCaptcha(AudienceCondition.WITH_AI_OVERVIEW);
    } else if (inputCaptcha === WITHOUT_AI_TEST) {
      completeCaptcha(AudienceCondition.WITHOUT_AI_OVERVIEW);
    } else {
      toaster.create({
        description: "Captcha does not match! Try again.",
        type: "error",
        duration: 5000,
      });
      generateCaptchaCheck();
      setInputCaptcha("");
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
