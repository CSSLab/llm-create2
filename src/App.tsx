import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import "./index.css";
// import Captcha from "./pages/Captcha";
import ConsentForm from "./pages/ConsentForm";
// import AristPreSurvey from "./pages/artist/PreSurvey";
import ArtistInstructions from "./pages/artist/instructions/Instructions";
import ArtistTransitionStep1 from "./pages/artist/step1/TransitionStep1";
import ArtistStep1 from "./pages/artist/step1/Step1";
import ArtistTransitionStep2 from "./pages/artist/step2/TransitionStep2";
import ArtistStep2 from "./pages/artist/step2/Step2";
import ArtistPostSurvey from "./pages/artist/PostSurvey";
import ThankYou from "./pages/ThankYou";
import UserError from "./pages/Error";
import PoemViewer from "./pages/PoemViewer";
import usePreventRefresh from "./components/shared/preventRefresh";
import usePreventBack from "./components/shared/preventBackBttn";
import { nanoid } from "nanoid";
import AudienceCaptcha from "./pages/audience/AudienceCaptcha";
import AudiencePoems from "./pages/audience/step2/Step2";
// import AudienceInstructions from "./pages/audience/instructions/Instructions";
// ================= AUDIENCE PAGES =================
// import ChooseYourCharacter from "./pages/ChooseYourCharacter";
// import AudiencePreSurvey from "./pages/audience/PreSurvey";
// import AudienceTransitionStep1 from "./pages/audience/step1/TransitionStep1";
// import AudienceStep1 from "./pages/audience/step1/Step1";
// import AudienceStep2 from "./pages/audience/step2/Step2";
// import AudienceTransitionStep2 from "./pages/audience/step2/TransitionStep2";
// import AudiencePostSurvey from "./pages/audience/PostSurvey";
import LLMInstruction from "./pages/artist/instructions/llmInstructions";
import { useState, createContext, useEffect, useRef } from "react";
import type {
  UserData,
  Artist,
  Audience,
  ArtistSurvey,
  AudienceSurvey,
  SurveyAnswers,
  RankingData,
  ReRankingData,
  ProlificMeta,
} from "./types";
import { Provider } from "./components/ui/provider";
import { Toaster } from "./components/ui/toaster";
import { globalSaveQueue } from "./utils/saveQueue";
import AudienceInstructions from "./pages/audience/instructions/Instructions";
import AudiencePostSurvey from "./pages/audience/PostSurvey";
import AudienceThankYou from "./pages/audience/ThankYou";
import AudienceStatementMatch from "./pages/audience/step2/StatementMatch";
import AudienceCreativity from "./pages/audience/step2/Creativity";
import AudienceAIDetection from "./pages/audience/step2/AIDetection";


interface DataContextValue {
  userData: UserData | null;
  addUserData: (newData: Partial<UserData>) => void;
  addRoleSpecificData: (updates: Partial<Artist> | Partial<Audience>) => void;
  addPreSurvey: (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>,
  ) => void;
  addPostSurvey: (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>,
  ) => void;
  addPoemEvaluation: (
    poemId: string,
    answers: SurveyAnswers,
    additionalData?: Partial<Audience>
  ) => void;
  addRankSurvey: (rankingData: RankingData) => void;
  addAISurvey: (answers: SurveyAnswers) => void;
  addReRankSurvey: (reRankingData: ReRankingData) => void;
  sessionId: string | null;
  prolific: ProlificMeta | null;
  flushSaves: () => Promise<void>;
  isTestMode: boolean;
  setIsTestMode: (value: boolean) => void;
}

export const DataContext = createContext<DataContextValue | null>(null);

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [prolific, setProlific] = useState<ProlificMeta | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<UserData | null>(null);

  usePreventRefresh(
    "To make sure your session counts, please avoid refreshing the page. Do you still want to refresh?",
  );
  usePreventBack(
    "To make sure your session counts, please avoid pressing the back button.",
  );

  // clear session storage and set the session ID on first render
  useEffect(() => {
    sessionStorage.clear();

    const params = new URLSearchParams(window.location.search);
    const prolificPid = params.get("PROLIFIC_PID");
    const studyId = params.get("STUDY_ID");
    const prolificSessionId = params.get("SESSION_ID");

    const id = prolificSessionId ?? nanoid();

    sessionStorage.setItem("sessionId", id);
    setSessionId(id);

    if (prolificPid && studyId && prolificSessionId) {
      setProlific({ prolificPid, studyId, prolificSessionId });
    }
  }, []);

  // Runs whatever save is currently pending, right now, via the serial
  // queue (so concurrent/rapid saves don't race each other in Firestore).
  const runPendingSave = () => {
    const data = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!data || !sessionId) return Promise.resolve();

    const endpoint =
      data.role === "artist"
        ? "/api/firebase/artist/autosave"
        : "/api/firebase/audience/autosave";

    return globalSaveQueue.enqueue(() =>
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, data }),
      }).then(() => undefined),
    );
  };

  const enqueueAutosave = (data: UserData | null) => {
    if (!data || !sessionId) return;
    pendingSaveRef.current = data;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      runPendingSave();
    }, 500);
  };

  // Cancels the debounce timer and saves immediately — used when the tab is
  // being hidden/closed, so a save doesn't get lost waiting on the timeout.
  const flushSaves = () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    return runPendingSave().then(() => globalSaveQueue.flush());
  };

  const addUserData = (newData: Partial<UserData>) => {
    setUserData((prev) => {
      const data = {
        ...(prev || {}),
        ...newData,
        data: {
          ...(prev?.data || {}),
          ...(newData.data || {}),
        },
      };

      return data as UserData;
    });
  };

  const addRoleSpecificData = (
    updates: Partial<Artist> | Partial<Audience>,
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error(
          "Tried to update data when userData is null or incomplete.",
        );
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          ...updates,
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  const addPreSurvey = (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>,
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update pre-survey when userData is null.");
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            preSurvey: {
              ...(prev.data.surveyResponse?.preSurvey || {}),
              ...(updates.preSurvey || {}),
            },
            preAnswers: {
              ...(prev.data.surveyResponse?.preAnswers || {}),
              ...(updates.preAnswers || {}),
            },
          },
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  const addPostSurvey = (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>,
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update post-survey when userData is null.");
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            postSurvey: {
              ...(prev.data.surveyResponse?.postSurvey || {}),
              ...(updates.postSurvey || {}),
            },
            postAnswers: {
              ...(prev.data.surveyResponse?.postAnswers || {}),
              ...(updates.postAnswers || {}),
            },
          },
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  const addPoemEvaluation = (
    poemId: string,
    answers: SurveyAnswers,
    additionalData?: Partial<Audience>
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error(
          "Tried to update poem evaluation when userData is null."
        );
      }

      const poemAnswer = { poemId, ...answers };
      const existingPoemAnswers = prev.data.surveyResponse?.poemAnswers ?? [];

      const next = {
        ...prev,
        data: {
          ...prev.data,
          ...additionalData,
          surveyResponse: {
            ...prev.data.surveyResponse,
            poemAnswers: [...existingPoemAnswers, poemAnswer],
          },
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  const addRankSurvey = (rankingData: RankingData) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update rank survey when userData is null.");
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            rankingData,
          },
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  const addAISurvey = (answers: SurveyAnswers) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update AI survey when userData is null.");
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            AIAnswers: answers,
          },
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  const addReRankSurvey = (reRankingData: ReRankingData) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update re-rank survey when userData is null.");
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            reRankingData,
          },
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  // Flush saves on tab hide/close
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        // best effort flush queued writes
        flushSaves();
      }
    };
    const onBeforeUnload = () => {
      if (userData) {
        // attempt synchronous backup
        sessionStorage.setItem("userDataSnapshot", JSON.stringify(userData));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [userData]);

  return (
    <DataContext.Provider
      value={{
        userData,
        addUserData,
        addRoleSpecificData,
        addPostSurvey,
        addPreSurvey,
        addPoemEvaluation,
        addRankSurvey,
        addAISurvey,
        addReRankSurvey,
        sessionId,
        prolific,
        flushSaves,
        isTestMode,
        setIsTestMode,
      }}
    >
      <Provider>
        <div className="w-screen h-screen">
          <Toaster />
          <Router>
            <Routes>
              {/* <Route path="/" element={<Captcha />} /> */}
              <Route path="/" element={<AudienceCaptcha />} />
              <Route path="/consent" element={<ConsentForm />} />
              <Route path="/poem-viewer" element={<PoemViewer />} />
              {userData && (
                <>
                  {/* <Route
                    path="/artist/pre-survey"
                    element={<AristPreSurvey />}
                  /> */}
                  <Route
                    path="/audience/instructions"
                    element={<AudienceInstructions />}
                  />
                  <Route path="/audience/poems" element={<AudiencePoems />} />
                  <Route
                    path="/audience/statements"
                    element={<AudienceStatementMatch />}
                  />
                  <Route
                    path="/audience/creativity"
                    element={<AudienceCreativity />}
                  />
                  <Route
                    path="/audience/ai-detection"
                    element={<AudienceAIDetection />}
                  />

                  <Route
                    path="/audience/post-survey"
                    element={<AudiencePostSurvey />}
                  />
                  <Route
                    path="/audience/thank-you"
                    element={<AudienceThankYou />}
                  />
                  <Route
                    path="/artist/instructions"
                    element={<ArtistInstructions />}
                  />
                  <Route
                    path="/artist/step-1"
                    element={<ArtistTransitionStep1 />}
                  />
                  <Route path="/artist/brainstorm" element={<ArtistStep1 />} />
                  <Route
                    path="/artist/step-2"
                    element={<ArtistTransitionStep2 />}
                  />
                  <Route path="/artist/blackout" element={<ArtistStep2 />} />
                  <Route
                    path="/artist/post-survey"
                    element={<ArtistPostSurvey />}
                  />
                  <Route
                    path="/artist/assistant-instructions"
                    element={<LLMInstruction />}
                  />
                  <Route path="/artist/thank-you" element={<ThankYou />} />
                </>
              )}

              <Route path="/*" element={<UserError />} />
              {/* 
              AUDIENCE ROUTES
              <Route
                path="/audience/step-1"
                element={<AudienceTransitionStep1 />}
              />
              <Route path="/audience/read" element={<AudienceStep1 />} />
              <Route
                path="/audience/step-2"
                element={<AudienceTransitionStep2 />}
              />
               <Route
                path="/audience/poem-surveys"
                element={<AudienceStep2 />}
              />


               <Route
                path="/audience/pre-survey"
                element={<AudiencePreSurvey />}
              />

              <Route
                path="/audience/instructions"
                element={<AudienceInstructions />}
              />

              <Route
                path="/audience/post-survey"
                element={<AudiencePostSurvey />}
              /> */}

              {/* <Route path="/choice" element={<ChooseYourCharacter />} /> */}
            </Routes>
          </Router>
        </div>
      </Provider>
    </DataContext.Provider>
  );
}

export default App;
