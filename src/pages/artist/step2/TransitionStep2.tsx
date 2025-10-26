import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../../App";

const ArtistTransitionStep2 = () => {
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
    if (condition == "WRITING") {
      navigate("/artist/assistant-instructions");
    } else {
      navigate("/artist/blackout");
    }
  };

  return (
    <PageTemplate
      background="bg4"
      nextButton={{ text: "Next", action: handleSubmit }}
    >
      <div className="w-full h-full flex-col content-center justify-items-center space-y-4">
        <p className="text-h1-dark w-80">
          Are you ready to begin Step 2: Blackout?
        </p>
        <p className="text-main-dark w-80 text-sm">
          You will make your blackout poem by selecting words from the text.
        </p>
        <p className="text-main-dark w-80 text-sm">
          You will have no time limit for this task.
        </p>
      </div>
    </PageTemplate>
  );
};

export default ArtistTransitionStep2;
