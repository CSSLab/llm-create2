import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import BlackoutPoetry from "../../../components/blackout/Blackout";
import { Tabs } from "@chakra-ui/react";
import ChatTab from "../../../components/chatbot/Chatbot";
import { Textarea } from "@chakra-ui/react";
import type { ArtistCondition, Message } from "../../../types";
import { DataContext } from "../../../App";

const ArtistStep2 = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData } = context;
  const [userType] = useState<ArtistCondition>(
    userData?.data.condition as ArtistCondition
  );
  const [notes, setNotes] = useState("");
  const [writeMessages, setWriteMessages] = useState<Message[]>([]);

  const navigate = useNavigate();

  console.log(userData);

  const onComplete = () => {
    navigate("/artist/post-survey");
  };

  return (
    <PageTemplate
      background="bg3"
      title="Step 2: Blackout"
      description="Write a blackout poem by selecting words in the passage. Let your imagination run wild!"
      nextButton={{ text: "Submit", action: onComplete }}
    >
      <div className="w-full h-full flex flex-col md:flex-row md:space-x-12">
        <div className="w-full md:w-1/2 h-full">
          <BlackoutPoetry />
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
              {(userType === "WRITING" || userType === "TOTAL_ACCESS") && (
                <Tabs.Trigger value="tab-2">LLM</Tabs.Trigger>
              )}
            </Tabs.List>
            <Tabs.Content value="tab-2" className="w-full h-4/5">
              <ChatTab
                messages={writeMessages}
                setMessages={setWriteMessages}
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

export default ArtistStep2;
