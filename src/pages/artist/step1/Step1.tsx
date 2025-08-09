import { useNavigate } from "react-router-dom";
import { useState } from "react";
import MultiPageTemplate from "../../../components/shared/pages/multiPage";
import { ArtistCondition } from "../../../types";

const ArtistStep1 = () => {
  const [passage] = useState(
    "Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear."
  );
  const navigate = useNavigate();
  const [userType] = useState<ArtistCondition>("TOTAL_ACCESS");

  const onComplete = () => {
    navigate("/artist/step-2");
  };

  return (
    <MultiPageTemplate
      title="Step 1: Brainstorm"
      description="This is your time to familiarize yourself with the text and brainstorm for your poem. Feel free to take notes of your ideas. Your notes will be accessible during the writing portion."
      duration={900}
      afterDuration={onComplete}
      llmAccess={userType == "TOTAL_ACCESS" || userType == "SPARK"}
    >
      <div className="h-full w-full flex">
        <p className="text-main text-sm md:text-base">{passage}</p>
      </div>
    </MultiPageTemplate>
  );
};

export default ArtistStep1;
