import { useNavigate } from "react-router-dom";
import { useState, useRef, useCallback, useEffect } from "react";
import MultiPageTemplate from "../../../components/shared/pages/multiPage";
import BlackoutPoetry from "../../../components/blackout/Blackout";
import type { Artist, ArtistCondition, Message } from "../../../types";
import { useContext } from "react";
import { DataContext } from "../../../App";
import { Stage } from "../../../types";

const ArtistStep2 = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;

  const artistData = userData?.data as Artist;
  const artistPoem = artistData?.poem;

  const writeMessagesRef = useRef<Message[]>([]);
  const selectedWordIndexesRef = useRef<number[]>([]);
  const writeNotesRef = useRef<string>("");

  const [writeNotes, setWriteNotes] = useState(
    artistData?.poem?.sparkNotes || ""
  );
  const [writeMessages, setWriteMessages] = useState<Message[]>(
    artistPoem.sparkConversation || []
  );
  const [selectedWordIndexes, setSelectedWordIndexes] = useState<number[]>([]);
  const userType = userData?.data.condition as ArtistCondition;

  const onComplete = useCallback(() => {
    artistPoem.writeConversation = writeMessagesRef.current || [];
    artistPoem.text = selectedWordIndexesRef.current.sort((a, b) => a - b); // sorts indexes in ascending order
    artistPoem.writeNotes = writeNotesRef.current || "";

    addRoleSpecificData({
      poem: artistPoem,
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/post-survey");
  }, []);

  useEffect(() => {
    writeMessagesRef.current = writeMessages;
    selectedWordIndexesRef.current = selectedWordIndexes;
    writeNotesRef.current = writeNotes;
  }, [writeMessages, writeNotes, selectedWordIndexes]);

  return (
    <MultiPageTemplate
      title="Step 2: Blackout"
      description="Create a poem by clicking on words in the passage."
      llmAccess={userType == "TOTAL_ACCESS" || userType == "WRITING"}
      stage={Stage.WRITE}
      messages={writeMessages}
      setMessages={setWriteMessages}
      notes={writeNotes}
      setNotes={setWriteNotes}
    >
      <div className="h-max w-full flex flex-col justify-between">
        <BlackoutPoetry
          onSubmit={onComplete}
          selectedWordIndexes={selectedWordIndexes}
          setSelectedWordIndexes={setSelectedWordIndexes}
        />
      </div>
    </MultiPageTemplate>
  );
};

export default ArtistStep2;
