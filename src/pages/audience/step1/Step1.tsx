import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";

const AudiencePassage = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;

  const passageId = (userData as any)?.data?.passageId || "1";

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];

  const handleSubmit = () => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/poems");
  };

  return (
    <PageTemplate
      title="Step 1: Familiarize yourself with the text"
      description="This is your time to familiarize yourself with the text. After this step, you will read several blackout poems created from this text and answer a couple of questions about each poem."
      duration={30}
      autoRedirectDuration={240}
      afterDuration={handleSubmit}
      buttonText="Begin Reading Poems"
    >
      <div className="w-[50vh] md:w-[60vh] h-max flex-col space-y-6 pt-4 md:pt-8 self-center">
        <p
          className="text-main text-justify text-sm md:text-base select-none"
          onCopy={(e) => e.preventDefault()}
        >
          {passage.text}
        </p>
        <p className="text-xs text-grey text-left pt-2">
          <span className="italic">{'"' + passage.title + '"'}</span>
          <span>{", " + passage.author + " from The New York Times"}</span>
        </p>
      </div>
    </PageTemplate>
  );
};

export default AudiencePassage;
