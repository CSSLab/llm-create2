import { useNavigate } from "react-router-dom";
import { useState, useRef, useCallback, useEffect } from "react";
import MultiPageTemplate from "../../../components/shared/pages/multiPage";
import BlackoutPoetry from "../../../components/blackout/Blackout";
import type {
  Artist,
  ArtistCondition,
  Message,
  PoemSnapshot,
} from "../../../types";
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
  const poemSnapshotsRef = useRef<PoemSnapshot[]>([]);
  const writeNotesRef = useRef<string>("");
  const [writeNotes, setWriteNotes] = useState(
    artistData?.poem?.sparkNotes || ""
  );
  const [writeMessages, setWriteMessages] = useState<Message[]>(
    artistPoem.sparkConversation || []
  );
  const [selectedWordIndexes, setSelectedWordIndexes] = useState<number[]>([]);
  const [poemSnapshots, setPoemSnapshots] = useState<PoemSnapshot[]>([]);
  const userType = userData?.data.condition as ArtistCondition;

  const onComplete = useCallback(() => {
    artistPoem.writeConversation = writeMessagesRef.current || [];
    artistPoem.text = selectedWordIndexesRef.current;
    artistPoem.poemSnapshot = poemSnapshotsRef.current;
    artistPoem.writeNotes = writeNotesRef.current || "";

    addRoleSpecificData({
      poem: artistPoem,
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/post-survey");
  }, [addRoleSpecificData, userData?.data?.timeStamps, navigate]);

  useEffect(() => {
    writeMessagesRef.current = writeMessages;
    selectedWordIndexesRef.current = selectedWordIndexes;
    poemSnapshotsRef.current = poemSnapshots;
    writeNotesRef.current = writeNotes;
  }, [writeMessages, writeNotes, selectedWordIndexes, poemSnapshots]);

  return (
    <MultiPageTemplate
      title="Step 2: Write your poem"
      description="Create a poem by clicking on words in the passage."
      duration={2}
      autoRedirectDuration={420}
      afterDuration={onComplete}
      buttonText="Submit"
      llmAccess={userType == "TOTAL_ACCESS" || userType == "WRITING"}
      stage={Stage.WRITE}
      passage={artistPoem?.passage.text || ""}
      messages={writeMessages}
      setMessages={setWriteMessages}
      notes={writeNotes}
      setNotes={setWriteNotes}
      selectedWordIndexes={selectedWordIndexes}
    >
      <div className="h-max w-full flex flex-col justify-between">
        <BlackoutPoetry
          passageText={artistPoem?.passage.text || ""}
          selectedWordIndexes={selectedWordIndexes}
          setSelectedWordIndexes={setSelectedWordIndexes}
          setPoemSnapshots={setPoemSnapshots}
        />
      </div>
    </MultiPageTemplate>
  );
};

export default ArtistStep2;
