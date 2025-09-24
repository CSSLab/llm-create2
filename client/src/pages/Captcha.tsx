import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../components/shared/pages/halfPage";
import { Button, Input } from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";
import { DataContext } from "../App";
import { ArtistCondition } from "../types";

const TEST_CAPTCHA = "*TEST";

const getRandomArtistCondition = (): ArtistCondition => {
  const values = Object.values(ArtistCondition);
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
};

const Captcha = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addUserData, addRoleSpecificData } = context;
  const [captchaMessage, setCaptchaMessage] = useState("");
  const [inputCaptcha, setInputCaptcha] = useState("");
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
        Math.floor(Math.random() * c_chars.length)
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

  const handleSubmit = () => {
    if (inputCaptcha === captchaMessage) {
      addUserData({ role: "artist" });
      addRoleSpecificData({ condition: getRandomArtistCondition() });
      addRoleSpecificData({
        timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
      });
      navigate("/consent");
    } else if (inputCaptcha == TEST_CAPTCHA) {
      addUserData({ role: "artist" });
      addRoleSpecificData({ condition: ArtistCondition.TOTAL_ACCESS });
      addRoleSpecificData({
        timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
      });
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
          placeholder="Type code here"
        />
        <Button className="btn-primary" onClick={handleSubmit}>
          Continue
        </Button>
      </div>
    </HalfPageTemplate>
  );
};

export default Captcha;
