import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../components/shared/pages/halfPage";
import { Button, Input } from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";
import { DataContext } from "../App";
import { ArtistCondition } from "../types";
import type { ArtistAssignment } from "../types";
import {
  CREATOR_PASSAGE_POOL_VERSION,
  Passages,
} from "../consts/passages";
import type { ChangeEvent, KeyboardEvent } from "react";
import {
  createEmptyPoem,
  createPassageSequence,
  getPassageForPoem,
  TOTAL_ARTIST_POEMS,
} from "../utils/artistRounds";

const TEST_CAPTCHA = "TEST";

interface ArtistPassagePlan {
  tutorialPassageId: string;
  passageIds: string[];
}

const createArtistPassagePlan = (): ArtistPassagePlan => {
  const sequence = createPassageSequence(Passages, TOTAL_ARTIST_POEMS + 1);
  return {
    tutorialPassageId: sequence[0],
    passageIds: sequence.slice(1),
  };
};

const Captcha = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const {
    userData,
    addUserData,
    addRoleSpecificData,
    setIsTestMode,
    sessionId,
    prolific,
  } = context;
  const [captchaMessage, setCaptchaMessage] = useState("");
  const [inputCaptcha, setInputCaptcha] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateCaptchaCheck();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    setInputCaptcha(event.target.value);

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

  const startArtist = (
    condition: ArtistCondition,
    passagePlan = createArtistPassagePlan(),
    strategy: ArtistAssignment["strategy"] = "TEST_OVERRIDE",
    passagePoolVersion = CREATOR_PASSAGE_POOL_VERSION,
  ) => {
    const { tutorialPassageId, passageIds } = passagePlan;
    const firstPassage = getPassageForPoem(Passages, passageIds, 1);
    addUserData({ role: "artist", prolific: prolific ?? undefined });
    addRoleSpecificData({
      condition,
      poem: createEmptyPoem(firstPassage),
      poemNumber: 1,
      totalPoems: TOTAL_ARTIST_POEMS,
      assignment: {
        strategy,
        passageId: firstPassage.id,
        passageIds,
        tutorialPassageId,
        taskPassageId: firstPassage.id,
        passagePoolVersion,
        condition,
        assignedAt: new Date(),
      },
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
  };

  const handleSubmit = async () => {
    if (isAssigning) return;
    if (inputCaptcha === "blackout") {
      startArtist(ArtistCondition.LLM);
      navigate("/artist/blackout");
    } else if (inputCaptcha === "control" || inputCaptcha === "noai") {
      startArtist(ArtistCondition.NO_AI);
      navigate("/consent");
    } else if (
      inputCaptcha === "llm" ||
      inputCaptcha === "spark" ||
      inputCaptcha === "writing" ||
      inputCaptcha === "complete"
    ) {
      startArtist(ArtistCondition.LLM);
      navigate("/consent");
    } else if (inputCaptcha === captchaMessage) {
      if (!sessionId) {
        toaster.create({
          description: "The session is still loading. Please try again.",
          type: "error",
          duration: 5000,
        });
        return;
      }

      setIsAssigning(true);
      try {
        const proposedPassagePlan = createArtistPassagePlan();
        const response = await fetch("/api/firebase/artist-assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            passageId: proposedPassagePlan.passageIds[0],
            passageIds: proposedPassagePlan.passageIds,
            tutorialPassageId: proposedPassagePlan.tutorialPassageId,
            passagePoolVersion: CREATOR_PASSAGE_POOL_VERSION,
            prolificPid: prolific?.prolificPid ?? null,
          }),
        });
        if (!response.ok) {
          throw new Error(`Assignment failed with status ${response.status}`);
        }
        const assignment = (await response.json()) as {
          passageId: string;
          tutorialPassageId: string;
          taskPassageId: string;
          passagePoolVersion: string;
          passageIds: string[];
          condition: ArtistCondition;
          strategy: ArtistAssignment["strategy"];
        };
        const tutorialPassage = Passages.find(
          (passage) => passage.id === assignment.tutorialPassageId,
        );
        const taskPassage = Passages.find(
          (passage) => passage.id === assignment.taskPassageId,
        );
        if (
          !tutorialPassage ||
          !taskPassage ||
          !Array.isArray(assignment.passageIds) ||
          assignment.passageIds.length !== TOTAL_ARTIST_POEMS ||
          assignment.passageId !== assignment.passageIds[0] ||
          assignment.taskPassageId !== assignment.passageIds[0] ||
          !assignment.passageIds.every((passageId) =>
            Passages.some((passage) => passage.id === passageId),
          ) ||
          assignment.passageIds.includes(tutorialPassage.id) ||
          !assignment.passagePoolVersion ||
          assignment.condition !== ArtistCondition.LLM ||
          assignment.strategy !== "LLM_ONLY"
        ) {
          throw new Error("Assignment response was invalid");
        }

        startArtist(
          assignment.condition,
          {
            tutorialPassageId: tutorialPassage.id,
            passageIds: assignment.passageIds,
          },
          assignment.strategy,
          assignment.passagePoolVersion,
        );
        navigate("/consent");
      } catch (error) {
        console.error("Study assignment failed", error);
        toaster.create({
          description:
            "We could not start your session. Please check your connection and try again.",
          type: "error",
          duration: 5000,
        });
      } finally {
        setIsAssigning(false);
      }
    } else if (inputCaptcha === "LLM_TEST") {
      setIsTestMode(true);
      startArtist(ArtistCondition.LLM);
      navigate("/consent");
    } else if (inputCaptcha === "NOLLM_TEST") {
      setIsTestMode(true);
      startArtist(ArtistCondition.NO_AI);
      navigate("/consent");
    } else if (inputCaptcha == TEST_CAPTCHA) {
      setIsTestMode(true);
      startArtist(ArtistCondition.LLM);
      navigate("/consent");
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
          disabled={isAssigning}
          placeholder="Type code here"
        />
        <Button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={isAssigning}
        >
          {isAssigning ? "Starting…" : "Continue"}
        </Button>
      </div>
    </HalfPageTemplate>
  );
};

export default Captcha;
