import { Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import CheatIcon from "../../../assets/cheat-icon.png";
import BlackoutExample from "../../../assets/blackout3.png";
import StarIcon from "../../../assets/star.svg";
import { useContext } from "react";
import { DataContext } from "../../../App";
import FullPageTemplate from "../../../components/shared/pages/fullScrollPage";

const ArtistInstructions = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;

  const handleSubmit = () => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/tutorial");
  };

  return (
    <FullPageTemplate
      title="Your Task"
      background="bg2"
      nextButton={{ text: "Begin Tutorial", action: handleSubmit }}
    >
      <div className="w-full flex flex-col space-y-6">
        {/* Intro */}
        <p className="text-main">
          In this study you will create a <strong>blackout poem</strong>. A
          blackout poem is a type of poem made by selecting words from an
          existing passage of text.
        </p>

        <p className="text-main font-semibold">Your final poem will be read by others.</p>

        <Image
          alt="Blackout Example"
          src={BlackoutExample}
          className="w-full lg:w-4/5 self-center"
        />

        <p className="text-main">
          {" "}
          We are focusing here on the process of writing rather than the result,
          so be sure to take time to understand and explore the source material,
          as well as your own holistic approach.
        </p>

        <p className="text-main">
          {" "}
          <strong>
            Don’t worry if you don’t have much experience with blackout poetry,
            we will guide you through the exercise.
          </strong>{" "}
          The most important thing is to be curious about what you can create!
        </p>

        {/* Steps */}
        <div className="space-y-3">
          <p className="text-main ">The task has three steps:</p>
          {[
            {
              label: "Tutorial",
              timing: null,
              desc: "Practice using the interface with a sample passage. Take as long as you like.",
            },
            {
              label: "Brainstorm",
              timing: "1–3 min",
              desc: "Read the passage and let ideas form. No need to choose words yet.",
            },
            {
              label: "Write your poem",
              timing: "3–5 min",
              desc: "Click words in the passage to select them and build your poem.",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 border border-light-grey-2 rounded-lg"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full  text-dark-grey text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <div>
                <p className="text-main flex items-center gap-1.5">
                  <span className="text-h3">{step.label}</span>
                  {step.timing && (
                    <>
                      <img
                        src={StarIcon}
                        alt=""
                        className="w-2.5 h-2.5 inline-block"
                      />
                      <span className="text-main">{step.timing}</span>
                    </>
                  )}
                </p>
                <p className="text-sub mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="border-light-grey-2" />

        {/* Warning */}
        <div className="w-full p-4 border rounded-lg border-light-grey-2 flex items-center gap-4">
          <Image
            alt="Cheat icon"
            src={CheatIcon}
            className="w-10 flex-shrink-0"
          />
          <p className="text-main text-sm">
            Important: Please do not take screenshots, copy text, or consult
            external tools such as ChatGPT. We're interested in your best effort
            and what you learn! In addition, do not refresh or use the browser's
            back/forward buttons as you will not be able to continue the task.
          </p>
        </div>
      </div>
    </FullPageTemplate>
  );
};

export default ArtistInstructions;
