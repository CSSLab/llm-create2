import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import {
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { Tabs } from "@chakra-ui/react";
import ChatTab from "../../../components/chatbot/Chatbot";
import { Textarea } from "@chakra-ui/react";
import type { ArtistCondition, Message, Poem } from "../../../types";
import { DataContext } from "../../../App";
import StarTimer from "../../../components/shared/starTimer";
import { nanoid } from "nanoid";

const ArtistStep1 = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { addRoleSpecificData } = context;
  const navigate = useNavigate();

  const [notes, setNotes] = useState("");
  const [passage] = useState(
    "Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear."
  );
  const [sparkMessages, setSparkMessages] = useState<Message[]>([]);
  const sparkMessagesRef = useRef<Message[]>([]);
  const [userType] = useState<ArtistCondition>("SPARK");

  const userPoem: Poem = {
    id: nanoid(),
    passageId: "",
    text: [],
    sparkConversation: [],
    writeConversation: [],
  };

  const onComplete = useCallback(() => {
    console.log(sparkMessagesRef.current);
    navigate("/artist/step-2");
  }, []);

  const timerComponent = useMemo(
    () => <StarTimer duration={30} onComplete={onComplete} />,
    [onComplete]
  );

  useEffect(() => {
    console.log("Remount");
    sparkMessagesRef.current = sparkMessages;
  }, [sparkMessages]);

  return (
    <PageTemplate
      background="bg3"
      title="Step 1: Brainstorm"
      description="This is your time to familiarize yourself with the text and brainstorm for your poem."
      timerComponent={timerComponent}
    >
      <div className="w-full h-full flex flex-col md:flex-row md:space-x-12">
        <div className="h-full w-full md:w-1/2 flex">
          <p className="text-main text-sm md:text-base">{passage}</p>
        </div>
        <div className="w-full md:w-1/2 h-full">
          <Tabs.Root
            lazyMount
            unmountOnExit
            defaultValue="tab-1"
            className="w-full h-full"
          >
            <Tabs.List className="space-x-4">
              <Tabs.Trigger value="tab-1">Notes</Tabs.Trigger>
              {(userType === "SPARK" || userType === "TOTAL_ACCESS") && (
                <Tabs.Trigger value="tab-2">LLM</Tabs.Trigger>
              )}
            </Tabs.List>
            <Tabs.Content value="tab-2" className="w-full h-4/5">
              <ChatTab
                messages={sparkMessages}
                setMessages={setSparkMessages}
              />
            </Tabs.Content>
            <Tabs.Content value="tab-1" className="w-full h-4/5">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take some notes..."
                className="text-main h-full flex-1 px-3 py-2 border rounded-md focus:outline-none focus:border-2 focus:border-grey"
              />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </PageTemplate>
  );
};

export default ArtistStep1;
