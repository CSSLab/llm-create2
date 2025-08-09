import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useCallback, useRef, useEffect } from "react";
import BlackoutPoetry from "../../../components/blackout/Blackout";
import { Tabs } from "@chakra-ui/react";
import ChatTab from "../../../components/chatbot/Chatbot";
import { Textarea } from "@chakra-ui/react";
import type { Artist, ArtistCondition, Message } from "../../../types";
import { DataContext } from "../../../App";
import MultiPageTemplate from "../../../components/shared/pages/multiPage";

const ArtistStep2 = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;
  const artistData = userData?.data as Artist;
  const artistPoem = artistData?.poem;

  const navigate = useNavigate();

  const writeMessagesRef = useRef<Message[]>([]);
  const selectedWordIndexesRef = useRef<number[]>([]);
  const writeNotesRef = useRef<string>("");

  const [userType] = useState<ArtistCondition>(
    userData?.data.condition as ArtistCondition
  );
  const [notes, setNotes] = useState(artistData.poem.sparkNotes);
  const [writeMessages, setWriteMessages] = useState<Message[]>([]);
  const [selectedWordIndexes, setSelectedWordIndexes] = useState<number[]>([]);

  const onComplete = useCallback(() => {
    artistPoem.writeConversation = writeMessagesRef.current;
    artistPoem.text = selectedWordIndexesRef.current;
    artistPoem.writeNotes = writeNotesRef.current;
    addRoleSpecificData({ poem: artistPoem });
    navigate("/artist/post-survey");
  }, []);

  useEffect(() => {
    writeMessagesRef.current = writeMessages;
    selectedWordIndexesRef.current = selectedWordIndexes;
    writeNotesRef.current = notes;
  }, [writeMessages, notes]);

  return (
    <MultiPageTemplate
      title="Step 2: Blackout"
      description="Create a poem by clicking on words in the passage."
      llmAccess={userType == "TOTAL_ACCESS" || userType == "WRITING"}
    >
      <div className="h-max w-full flex flex-col justify-between">
        <BlackoutPoetry
          selectedWordIndexes={selectedWordIndexes}
          setSelectedWordIndexes={setSelectedWordIndexes}
        />
      </div>
    </MultiPageTemplate>
  );
};

export default ArtistStep2;
