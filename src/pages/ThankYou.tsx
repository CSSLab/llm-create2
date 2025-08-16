import PageTemplate from "../components/shared/pages/page";
import { useContext } from "react";
import { DataContext } from "../App";

const ThankYou = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData } = context;
  console.log("Complete:", userData); // REMOVE

  return (
    <PageTemplate background="bg4">
      <div className="w-full h-full flex-col content-center justify-items-center space-y-4">
        <p className="text-h1-dark w-80">Thank you!</p>
        <p className="text-main-dark w-80 text-light-grey-1 text-sm">
          We are grateful for your time and we hope you found this enjoyable!
        </p>
      </div>
    </PageTemplate>
  );
};

export default ThankYou;
