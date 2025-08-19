import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../../App";
import { Image } from "@chakra-ui/react";
import LLMInstructionImage from "../../../assets/llm-example.png";

const LLMInstruction = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData } = context;
  const condition = userData?.data.condition;

  const handleSubmit = () => {
    if (condition == "SPARK" || condition == "TOTAL_ACCESS") {
      navigate("/artist/brainstorm");
    } else {
      navigate("/artist/blackout");
    }
  };

  return (
    <PageTemplate
      nextButton={{ text: "Next", action: handleSubmit }}
      background="bg3"
    >
      <div className="w-full h-full space-y-4">
        <div className="w-full h-max flex flex-row items-center space-x-4">
          <div className="w-8 h-8">
            <svg viewBox="0 0 92 106" className="w-full h-full">
              <path
                fill="#2F2F2F"
                d="M46 0L56.1221 35.468L91.8993 26.5L66.2442 53L91.8993 79.5L56.1221 70.532L46 106L35.8779 70.532L0.100655 79.5L25.7558 53L0.100655 26.5L35.8779 35.468L46 0Z"
              />
            </svg>
          </div>
          <p className="text-h1 w-full"> Introducing Blackout Assistant</p>
        </div>

        <div className="text-main text-grey pb-4">
          <p>
            {condition === "SPARK"
              ? "While brainstorming, you’ll have access to the Blackout Assistant. Feel free to explore and use it in whatever way helps you best — it’s completely up to you!"
              : condition === "WRITING"
              ? "While writing your blackout, you’ll have access to the Blackout Assistant. Feel free to explore and use it in whatever way helps you best — it’s completely up to you!"
              : "During brainstorming and writing your blackout, you’ll have access to the Blackout Assistant. Feel free to explore and use it in whatever way helps you best — it’s completely up to you!"}
          </p>
        </div>

        <Image
          alt="LLM Example"
          src={LLMInstructionImage}
          className="justify-self-center lg:h-96"
        />
      </div>
    </PageTemplate>
  );
};

export default LLMInstruction;
