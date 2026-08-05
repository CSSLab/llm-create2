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
      passageId: passageId,
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
      <div className="w-full h-full flex flex-col items-center">
        <div className="flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] md:min-w-[400ox] md:w-[400px] h-max ">
          {passage.text.split(" ").map((word, i) => (
            <span
              key={i}
              className="text-main font-serif text-dark-grey tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200"
            >
              {word + "\u00A0"}
            </span>
          ))}
          <p className="text-xs text-grey text-left pt-2 w-full">
            <span className="italic">{'"' + passage.title + '"'}</span>
            <span>{", " + passage.author}</span>
          </p>
        </div>
      </div>
    </PageTemplate>
  );
};

export default AudiencePassage;
