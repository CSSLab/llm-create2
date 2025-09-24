import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../../App";

const ArtistTransitionStep1 = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;
  const condition = userData?.data.condition;

  const handleSubmit = () => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    if (condition == "CONTROL" || condition == "WRITING") {
      navigate("/artist/brainstorm");
    } else {
      navigate("/artist/assistant-instructions");
    }
  };

  return (
    <PageTemplate
      background="bg4"
      nextButton={{ text: "Next", action: handleSubmit }}
    >
      <div className="w-full h-full flex-col content-center justify-items-center space-y-4">
        <p className="text-h1-dark w-64 md:w-80">
          Are you ready to begin Step 1: Brainstorm?
        </p>
        <p className="text-main-dark w-64 md:w-80 text-sm">
          This is your time to familiarize yourself with the text and brainstorm
          for your poem.
        </p>
        <p className="text-main-dark w-64 md:w-80 text-sm">
          You will have 5 minutes for this task.
        </p>
      </div>
    </PageTemplate>
  );
};

export default ArtistTransitionStep1;
