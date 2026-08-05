import { useContext } from "react";
import { DataContext } from "../../App";
import FullPageTemplate from "../../components/shared/pages/fullScrollPage";

const AudienceThankYou = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { isTestMode } = context;

  return (
    <FullPageTemplate background="bg4">
      <div className="grid min-h-[70vh] place-items-center">
        <div className="max-w-2xl text-center">
          <h1 className="mb-3 text-h1-dark">
            {isTestMode ? "Preview complete" : "Thank you!"}
          </h1>
          <p className="text-main-dark">
            {isTestMode
              ? "This preview used dummy poems. No responses were saved."
              : "Your responses have been recorded. We are grateful for your time and thoughtful attention to the poems."}
          </p>
        </div>
      </div>
    </FullPageTemplate>
  );
};

export default AudienceThankYou;
