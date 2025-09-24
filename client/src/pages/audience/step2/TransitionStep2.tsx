import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";

const AudienceTransitionStep2 = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate("/audience/poem-surveys");
  };

  return (
    <PageTemplate
      background="bg4"
      nextButton={{ text: "Next", action: handleSubmit }}
    >
      <div className="w-full h-full flex-col content-center justify-items-center space-y-4">
        <p className="text-h1-dark w-80">
          Are you ready to begin Step 2: Share your thoughts?
        </p>
        <p className="text-main-dark w-80 text-light-grey-1 text-sm">
          For each poem, you will fill out a quick survey letting us know what
          you think of the work. Once you answer for one poem, you cannot return
          to it.
        </p>
        <p className="text-main-dark w-80 text-light-grey-1 text-sm">
          You will have about 4 minutes per poem.
        </p>
      </div>
    </PageTemplate>
  );
};

export default AudienceTransitionStep2;
