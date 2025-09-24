import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import MultiPageTemplate from "../../../components/shared/pages/multiPage";
import { ArtistCondition } from "../../../types";
import { Stage } from "../../../types";
import type { Message, Poem } from "../../../types";
import { useContext } from "react";
import { DataContext } from "../../../App";

const ArtistStep1 = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;

  const sparkMessagesRef = useRef<Message[]>([]);
  const sparkNotesRef = useRef<string>("");

  const [passage] = useState(
    "Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear."
  );
  const userType = userData?.data.condition as ArtistCondition;
  const [sparkMessages, setSparkMessages] = useState<Message[]>([]);
  const [sparkNotes, setSparkNotes] = useState<string>("");

  let artistPoem: Poem = {
    passageId: "",
    text: [],
    sparkConversation: [],
    writeConversation: [],
    sparkNotes: "",
    writeNotes: "",
  };

  const onComplete = useCallback(() => {
    artistPoem.sparkConversation = sparkMessagesRef.current;
    artistPoem.sparkNotes = sparkNotesRef.current;
    addRoleSpecificData({
      poem: artistPoem,
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/step-2");
  }, []);

  useEffect(() => {
    sparkMessagesRef.current = sparkMessages;
    sparkNotesRef.current = sparkNotes;
  }, [sparkMessages, sparkNotes]);

  return (
    <MultiPageTemplate
      title="Step 1: Brainstorm"
      description="This is your time to familiarize yourself with the text and brainstorm for your poem. Feel free to take notes of your ideas. Your notes will be accessible during the writing portion."
      duration={300}
      afterDuration={onComplete}
      llmAccess={userType == "TOTAL_ACCESS" || userType == "SPARK"}
      stage={Stage.SPARK}
      messages={sparkMessages}
      setMessages={setSparkMessages}
      notes={sparkNotes}
      setNotes={setSparkNotes}
    >
      <div className="h-full w-full flex">
        <p className="text-main text-sm md:text-base">{passage}</p>
      </div>
    </MultiPageTemplate>
  );
};

export default ArtistStep1;
