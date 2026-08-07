import PageTemplate from "../../components/shared/pages/page";
import { useContext } from "react";
import { DataContext } from "../../App";

const AudienceThankYou = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { isTestMode } = context;

  return (
    <PageTemplate background="bg4" title="">
      <div className="w-full h-full flex-col content-center justify-items-center grid">
        <div className="max-w-3xl h-full flex flex-col">
          <p className="text-h1-dark text-center mb-2">
            {isTestMode ? "Preview complete!" : "Thank you!"}
          </p>
          <p className="text-main-dark text-sm text-center mb-4">
            {isTestMode
              ? "This was a preview using dummy poems, so nothing was saved. Thanks for trying it out!"
              : "We are grateful for your time and we hope you found this enjoyable!"}
          </p>
        </div>
      </div>
    </PageTemplate>
  );
};

export default AudienceThankYou;
