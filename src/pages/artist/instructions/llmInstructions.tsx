import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../../App";
import { Image } from "@chakra-ui/react";
import LLMInstructionImage from "../../../assets/llm-example.png";
import StarIcon from "../../../assets/star.svg";

const LLMInstruction = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const handleSubmit = () => {
    navigate("/artist/brainstorm");
  };

  return (
    <PageTemplate
      nextButton={{ text: "Got it", action: handleSubmit }}
      background="bg3"
    >
      <div className="w-full h-full space-y-5">
        {/* Header */}
        <div className="flex flex-row items-center space-x-3">
          <div className="w-7 h-7 flex-shrink-0">
            <svg viewBox="0 0 92 106" className="w-full h-full">
              <path
                fill="#2F2F2F"
                d="M46 0L56.1221 35.468L91.8993 26.5L66.2442 53L91.8993 79.5L56.1221 70.532L46 106L35.8779 70.532L0.100655 79.5L25.7558 53L0.100655 26.5L35.8779 35.468L46 0Z"
              />
            </svg>
          </div>
          <p className="text-h1">Meet your AI Assistant</p>
        </div>

        <p className="text-main text-grey">
          You have access to an AI assistant during both steps of the task. It's
          there to support your process — use it as much or as little as you
          like.
        </p>

        {/* Tips */}
        <div className="space-y-2">
          {[
            "Ask it about themes, tone, or ideas you notice in the passage",
            "Request word suggestions or help narrowing your focus",
            "Use it to think out loud — it can ask you questions too",
            "It can see which words you've selected, so it understands your poem as it develops",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <img src={StarIcon} alt="" className="w-2.5 h-2.5 mt-1 flex-shrink-0" />
              <p className="text-main text-sm">{tip}</p>
            </div>
          ))}
        </div>

        <Image
          alt="LLM Example"
          src={LLMInstructionImage}
          className="justify-self-center max-h-52 lg:max-h-64"
        />
      </div>
    </PageTemplate>
  );
};

export default LLMInstruction;
