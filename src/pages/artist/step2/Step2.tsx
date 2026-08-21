import { useNavigate } from "react-router-dom";
import { useState, useRef, useCallback, useEffect } from "react";
import MultiPageTemplate from "../../../components/shared/pages/multiPage";
import BlackoutPoetry from "../../../components/blackout/Blackout";
import type {
  Artist,
  ArtistCondition,
  ChatAvailability,
  ChatInputActivity,
  LlmRequestLog,
  Message,
  PoemSnapshot,
} from "../../../types";
import { useContext } from "react";
import { DataContext } from "../../../App";
import { Stage } from "../../../types";
import { Button } from "@chakra-ui/react";
import { getChatAvailability } from "../../../utils/llmUsage";

const ArtistStep2 = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;

  const artistData = userData?.data as Artist;
  const artistPoem = artistData?.poem;
  const userType = userData?.data.condition as ArtistCondition;

  const writeMessagesRef = useRef<Message[]>([]);
  const selectedWordIndexesRef = useRef<number[]>([]);
  const poemSnapshotsRef = useRef<PoemSnapshot[]>([]);
  const writeNotesRef = useRef<string>("");
  const phaseStartedAtRef = useRef<Date | null>(null);
  const llmRequestsRef = useRef<LlmRequestLog[]>(
    artistPoem?.llmUsage?.requests ?? [],
  );
  const chatAvailabilityRef = useRef<ChatAvailability[]>(
    getChatAvailability(artistPoem?.llmUsage),
  );
  const inputActivityRef = useRef<ChatInputActivity[]>(
    artistPoem?.llmUsage?.inputActivity ?? [],
  );
  const [writeNotes, setWriteNotes] = useState(
    artistData?.poem?.sparkNotes || "",
  );
  const [writeMessages, setWriteMessages] = useState<Message[]>(() => [
    ...(artistPoem?.sparkConversation ?? []),
  ]);
  const [selectedWordIndexes, setSelectedWordIndexes] = useState<number[]>([]);
  const [poemSnapshots, setPoemSnapshots] = useState<PoemSnapshot[]>([]);
  const [showPopup, setShowPopup] = useState(true);

  const handleChatAvailable = useCallback((availability: ChatAvailability) => {
    const alreadyLogged = chatAvailabilityRef.current.some(
      (item) => item.stage === availability.stage,
    );
    if (!alreadyLogged) chatAvailabilityRef.current.push(availability);
  }, []);

  const handleInputActivityUpdate = useCallback(
    (activity: ChatInputActivity) => {
      const existingIndex = inputActivityRef.current.findIndex(
        (item) => item.stage === activity.stage,
      );
      if (existingIndex >= 0) {
        inputActivityRef.current[existingIndex] = activity;
      } else {
        inputActivityRef.current.push(activity);
      }
    },
    [],
  );

  const handleRequestUpdate = useCallback((request: LlmRequestLog) => {
    const existingIndex = llmRequestsRef.current.findIndex(
      (item) => item.id === request.id,
    );
    if (existingIndex >= 0) {
      llmRequestsRef.current[existingIndex] = request;
    } else {
      llmRequestsRef.current.push(request);
    }
  }, []);

  const onComplete = useCallback(() => {
    const completedAt = new Date();
    const startedAt = phaseStartedAtRef.current ?? completedAt;
    const taskStartedAt = artistPoem.taskTiming?.startedAt ?? startedAt;
    const updatedPoem = {
      ...artistPoem,
      writeConversation: writeMessagesRef.current || [],
      text: selectedWordIndexesRef.current,
      poemSnapshot: poemSnapshotsRef.current,
      writeNotes: writeNotesRef.current || "",
      taskTiming: {
        ...(artistPoem.taskTiming ?? { phases: {} }),
        startedAt: taskStartedAt,
        completedAt,
        totalDurationMs: completedAt.getTime() - taskStartedAt.getTime(),
        phases: {
          ...(artistPoem.taskTiming?.phases ?? {}),
          write: {
            startedAt,
            completedAt,
            durationMs: completedAt.getTime() - startedAt.getTime(),
          },
        },
      },
      llmUsage: {
        chatAvailability: chatAvailabilityRef.current,
        inputActivity: inputActivityRef.current,
        requests: llmRequestsRef.current,
      },
    };

    addRoleSpecificData({
      poem: updatedPoem,
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/post-survey");
  }, [addRoleSpecificData, artistPoem, userData?.data?.timeStamps, navigate]);

  useEffect(() => {
    if (!showPopup && !phaseStartedAtRef.current) {
      phaseStartedAtRef.current = new Date();
    }
  }, [showPopup]);

  useEffect(() => {
    writeMessagesRef.current = writeMessages;
    selectedWordIndexesRef.current = selectedWordIndexes;
    poemSnapshotsRef.current = poemSnapshots;
    writeNotesRef.current = writeNotes;
  }, [writeMessages, writeNotes, selectedWordIndexes, poemSnapshots]);

  return (
    <>
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-h3">Write your poem</p>
              <span className="text-sub">· 3–5 min</span>
            </div>
            <p className="text-sub">It's time to start building your poem!</p>

            <p className="text-sub">
              Select words in the passage by clicking on them. Re-click a
              selected word to remove it from your poem.
            </p>

            <p className="text-sub">
              Your notes from the brainstorm step are available below.
            </p>
            <Button
              className="btn-primary w-full"
              onClick={() => setShowPopup(false)}
            >
              Begin
            </Button>
          </div>
        </div>
      )}
      <MultiPageTemplate
        title="Write your poem"
        description="Create a poem by clicking on words in the passage."
        duration={showPopup ? undefined : 180}
        autoRedirectDuration={showPopup ? undefined : 420}
        afterDuration={onComplete}
        buttonText="Submit"
        llmAccess={userType == "LLM"}
        chatReady={!showPopup}
        stage={Stage.WRITE}
        passage={artistPoem?.passage.text || ""}
        messages={writeMessages}
        setMessages={setWriteMessages}
        notes={writeNotes}
        setNotes={setWriteNotes}
        selectedWordIndexes={selectedWordIndexes}
        initialInputActivity={inputActivityRef.current.find(
          (activity) => activity.stage === Stage.WRITE,
        )}
        onChatAvailable={
          userType === "LLM" ? handleChatAvailable : undefined
        }
        onInputActivityUpdate={
          userType === "LLM" ? handleInputActivityUpdate : undefined
        }
        onRequestUpdate={userType === "LLM" ? handleRequestUpdate : undefined}
      >
        <div className="h-max w-full flex flex-col justify-between">
          <BlackoutPoetry
            passageText={artistPoem?.passage.text || ""}
            passageTitle={artistPoem?.passage.title}
            passageAuthor={artistPoem?.passage.author}
            selectedWordIndexes={selectedWordIndexes}
            setSelectedWordIndexes={setSelectedWordIndexes}
            setPoemSnapshots={setPoemSnapshots}
          />
        </div>
      </MultiPageTemplate>
    </>
  );
};

export default ArtistStep2;
