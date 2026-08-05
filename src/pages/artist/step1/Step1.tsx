import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import MultiPageTemplate from "../../../components/shared/pages/multiPage";
import { ArtistCondition } from "../../../types";
import { Stage } from "../../../types";
import type {
  ChatAvailability,
  ChatInputActivity,
  LlmRequestLog,
  Message,
  Poem,
} from "../../../types";
import { useContext } from "react";
import { DataContext } from "../../../App";
import type { Artist, Passage } from "../../../types";
import { Button } from "@chakra-ui/react";
import StarIcon from "../../../assets/star.svg";
import { getChatAvailability } from "../../../utils/llmUsage";

const ArtistStep1 = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;

  const sparkMessagesRef = useRef<Message[]>([]);
  const sparkNotesRef = useRef<string>("");
  const phaseStartedAtRef = useRef<Date | null>(null);

  const artistData = userData?.data as Artist;
  const existingPoem = artistData?.poem;
  const passage = existingPoem?.passage as Passage;
  const userType = userData?.data.condition as ArtistCondition;
  const isLLM = userType === "LLM";
  const llmRequestsRef = useRef<LlmRequestLog[]>(
    existingPoem?.llmUsage?.requests ?? [],
  );
  const chatAvailabilityRef = useRef<ChatAvailability[]>(
    getChatAvailability(existingPoem?.llmUsage),
  );
  const inputActivityRef = useRef<ChatInputActivity[]>(
    existingPoem?.llmUsage?.inputActivity ?? [],
  );

  const [sparkMessages, setSparkMessages] = useState<Message[]>([]);
  const [sparkNotes, setSparkNotes] = useState<string>("");

  // 0 = brainstorm instructions (all users), 1 = LLM assistant info (LLM only), done
  const [popupStep, setPopupStep] = useState(0);
  const totalPopups = isLLM ? 2 : 1;
  const showingPopup = popupStep < totalPopups;

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
    const artistPoem: Poem = {
      ...existingPoem,
      sparkConversation: sparkMessagesRef.current,
      sparkNotes: sparkNotesRef.current,
      taskTiming: {
        ...(existingPoem.taskTiming ?? { phases: {} }),
        startedAt: existingPoem.taskTiming?.startedAt ?? startedAt,
        phases: {
          ...(existingPoem.taskTiming?.phases ?? {}),
          spark: {
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
      poem: artistPoem,
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/blackout");
  }, [addRoleSpecificData, existingPoem, navigate, userData?.data?.timeStamps]);

  useEffect(() => {
    if (!showingPopup && !phaseStartedAtRef.current) {
      phaseStartedAtRef.current = new Date();
    }
  }, [showingPopup]);

  useEffect(() => {
    sparkMessagesRef.current = sparkMessages;
    sparkNotesRef.current = sparkNotes;
  }, [sparkMessages, sparkNotes]);

  const words = passage.text.split(" ");

  return (
    <>
      {showingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full mx-4 space-y-4">
            {popupStep === 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-h3">Brainstorm</p>
                  <span className="text-sub">· 1–3 min</span>
                </div>
                <p className="text-sub">
                  Read through the passage and let ideas form. What is it about?
                  What themes or words stand out? You can take notes in the box
                  below — they'll carry over into the writing step.
                </p>
                <Button
                  className="btn-primary w-full"
                  onClick={() => setPopupStep((s) => s + 1)}
                >
                  {isLLM ? "Next" : "Begin"}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <img
                    src={StarIcon}
                    alt=""
                    className="w-3.5 h-3.5 flex-shrink-0"
                  />
                  <p className="text-h3">You have an AI assistant</p>
                </div>
                <p className="text-sub">
                  You have access to an AI assistant on the right side of your
                  screen. Feel free to use it however you like, just as you
                  would any other AI chatbot.
                </p>
                <Button
                  className="btn-primary w-full"
                  onClick={() => setPopupStep((s) => s + 1)}
                >
                  Got it
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      <MultiPageTemplate
        title="Familiarize yourself with the text"
        description="This is your time to familiarize yourself with the text and brainstorm for your poem. What is the passage about? What themes appear? Do any words or ideas stand out? Feel free to take any notes in the text box below. Your notes will be accessible during the writing portion."
        duration={showingPopup ? undefined : 60}
        autoRedirectDuration={showingPopup ? undefined : 240}
        afterDuration={onComplete}
        buttonText="Begin Writing"
        llmAccess={isLLM}
        chatReady={!showingPopup}
        stage={Stage.SPARK}
        passage={passage.text}
        messages={sparkMessages}
        setMessages={setSparkMessages}
        notes={sparkNotes}
        setNotes={setSparkNotes}
        initialInputActivity={inputActivityRef.current.find(
          (activity) => activity.stage === Stage.SPARK,
        )}
        onChatAvailable={isLLM ? handleChatAvailable : undefined}
        onInputActivityUpdate={
          isLLM ? handleInputActivityUpdate : undefined
        }
        onRequestUpdate={isLLM ? handleRequestUpdate : undefined}
      >
        <div
          className={`w-full h-full flex flex-col items-center transition-all duration-300 ${showingPopup ? "blur-sm pointer-events-none select-none" : ""}`}
        >
          <div className="flex mx-auto flex-wrap select-none w-[350px] min-w-[350px] md:min-w-[400ox] md:w-[400px] h-max ">
            {words.map((word, i) => {
              return (
                <span
                  key={i}
                  className={`text-main font-serif tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] transition duration-200`}
                >
                  {word + " "}
                </span>
              );
            })}

            <p className="text-xs text-grey text-left pt-2">
              <span className="italic">{'"' + passage.title + '"'}</span>
              <span>
                {", " +
                  passage.author +
                  (passage.publication ? `, ${passage.publication}` : "")}
              </span>
            </p>
          </div>
        </div>
      </MultiPageTemplate>
    </>
  );
};

export default ArtistStep1;
