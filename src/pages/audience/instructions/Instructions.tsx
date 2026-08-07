import { Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import CheatIcon from "../../../assets/cheat-icon.png";
import BlackoutExample from "../../../assets/blackout3.png";
import StarIcon from "../../../assets/star.svg";
import { useContext } from "react";
import { DataContext } from "../../../App";
import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";

const AudienceInstructions = () => {
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
    navigate("/audience/poems");
  };

  return (
    <PageTemplate
      title="Your Task"
      nextButton={{ text: "Begin", action: handleSubmit }}
    >
      <div className="w-full flex flex-col space-y-6">
        {/* Intro */}
        <p className="text-main">
          In this study you will read <strong>blackout poems</strong> written by
          participants in a previous study. A blackout poem is made by selecting
          words from an existing passage of text to create a new poem. Read only
          the words that remain visible.
        </p>

        <Image
          alt="Blackout Example"
          src={BlackoutExample}
          className="w-full lg:w-4/5 self-center"
        />
        <p className="text-xs text-grey text-center italic">
          In the example above, the poem can be read as: "Pale picture once
          filled visions of possible future."
        </p>

        <p className="text-main">
          Your job is to read each poem carefully and share your thoughts.{" "}
          <strong> Don't worry about having a background in poetry </strong> —
          we're just interested in your honest reaction!
        </p>

        {/* Steps */}
        <div className="space-y-3">
          <p className="text-main">The task has four steps:</p>
          {[
            {
              label: "Read the poems & share your thoughts",
              timing: "~4 min per poem",
              desc: "Read several blackout poems one at a time and answer a few questions about each one.",
            },
            {
              label: "Match each poem to its statement",
              timing: "~1 min per poem",
              desc: "For each poem, choose which of a few short statements you think the creator actually wrote about it.",
            },
            {
              label: "Rate each poem's creativity",
              timing: "~1 min per poem",
              desc: "See the original passage each poem was created from and rate how creative you think it is.",
            },
            {
              label: "Share your impression",
              timing: "~1 min per poem",
              desc: "For each poem, share your impression of how it might have been created.",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 border border-light-grey-2 rounded-lg"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full text-dark-grey text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <div>
                <p className="text-main flex items-center gap-1.5">
                  <span className="text-h3">{step.label}</span>
                  <img
                    src={StarIcon}
                    alt=""
                    className="w-2.5 h-2.5 inline-block"
                  />
                  <span className="text-main">{step.timing}</span>
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
    </PageTemplate>
  );
};

export default AudienceInstructions;
