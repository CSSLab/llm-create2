import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../../App";
import AudiencePoem from "../../../components/audience/AudiencePoem";
import FullPageTemplate from "../../../components/shared/pages/fullScrollPage";
import {
  createAudienceTutorialPoem,
  getAudiencePoemText,
} from "../../../consts/audienceTutorialExamples";
import { Passages } from "../../../consts/passages";

const AudienceInstructions = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;
  const navigate = useNavigate();
  const audienceData = userData?.role === "audience" ? userData.data : null;
  const tutorialPassage = Passages.find(
    (passage) => passage.id === audienceData?.assignment.tutorialPassageId,
  );

  if (!tutorialPassage) {
    throw new Error("Audience tutorial passage is missing or invalid");
  }

  const examplePoem = createAudienceTutorialPoem(tutorialPassage);
  const visiblePoemText = getAudiencePoemText(examplePoem).replace(
    /[.!?]+$/,
    "",
  );

  const handleSubmit = () => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data.timeStamps ?? []), new Date()],
    });
    navigate("/audience/poems");
  };

  return (
    <FullPageTemplate
      title="Your task"
      description="You will read four blackout poems made by creators in an earlier study and share your honest response to each one."
      nextButton={{ text: "Begin", action: handleSubmit }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4">
        <section className="space-y-3">
          <h2 className="text-h2">What is blackout poetry?</h2>
          <p className="text-main">
            A creator starts with an existing passage and selects some words,
            keeping them in their original order. The remaining words are
            blacked out. Read only the words that remain visible.
          </p>
          <AudiencePoem poem={examplePoem} label="Short example" />
          <p className="text-sub">
            The visible poem reads: “{visiblePoemText}.” This example uses a
            randomly selected source from the same nine-text bank. Its source
            is different from the one used for the four study poems.
          </p>
        </section>

        <section className="rounded-xl border border-light-grey-2 p-5">
          <h2 className="mb-3 text-h2">What you will do</h2>
          <ol className="list-decimal space-y-2 pl-5 text-main">
            <li>Read each poem and answer questions about its meaning and your response.</li>
            <li>Choose which creator statement best matches each poem.</li>
            <li>See the source text and rate the poem’s creativity.</li>
            <li>Finally, estimate whether AI assistance may have been available.</li>
          </ol>
        </section>

        <p className="text-sub">
          Please do not take screenshots, copy text, or consult outside tools.
          Do not refresh the page or use the browser’s back and forward buttons.
        </p>
      </div>
    </FullPageTemplate>
  );
};

export default AudienceInstructions;
