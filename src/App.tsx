import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import "./index.css";
import Captcha from "./pages/Captcha";
import ConsentForm from "./pages/ConsentForm";
import AristPreSurvey from "./pages/artist/PreSurvey";
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
import ArtistTutorial from "./pages/artist/tutorial/Tutorial";
import { useState, createContext, useEffect, useRef } from "react";
import type {
  UserData,
  Artist,
  Audience,
  ArtistSurvey,
  AudienceSurvey,
  ProlificMeta,
  ArtistCondition,
} from "./types";
import { Provider } from "./components/ui/provider";
import { Toaster } from "./components/ui/toaster";
import { globalSaveQueue } from "./utils/saveQueue";

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
  sessionId: string | null;
  prolific: ProlificMeta | null;
  flushSaves: () => Promise<void>;
  disableRefreshGuard: () => void;
  isTestMode: boolean;
  setIsTestMode: (value: boolean) => void;
  previousCondition: ArtistCondition | null;
}

export const DataContext = createContext<DataContextValue | null>(null);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof Date);

/**
 * Recursively diffs `next` against `prev`, returning an object containing
 * only the keys whose value actually changed (nested plain objects are
 * diffed further; arrays/primitives/dates are compared as a whole). Used so
 * autosave only ships the sections of the session that changed instead of
 * the entire Artist/Audience payload every time - conversations and edit
 * snapshots make the full object grow large fast. Firestore's `set(...,
 * { merge: true })` on the server already merges nested objects
 * recursively, so sending a sparse object is enough to update just those
 * fields without clobbering the rest of the stored document.
 */
const diffForAutosave = (prev: unknown, next: unknown): unknown => {
  if (!isPlainObject(prev) || !isPlainObject(next)) {
    return prev === next ? undefined : next;
  }
  const out: Record<string, unknown> = {};
  let changed = false;
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const key of keys) {
    const diffed = diffForAutosave(prev[key], next[key]);
    if (diffed !== undefined) {
      out[key] = diffed;
      changed = true;
    }
  }
  return changed ? out : undefined;
};

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [prolific, setProlific] = useState<ProlificMeta | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [previousCondition, setPreviousCondition] =
    useState<ArtistCondition | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const { disable: disableRefreshGuard } = usePreventRefresh(
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
      fetch(
        `/api/firebase/participant-condition?prolificPid=${encodeURIComponent(prolificPid)}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.condition)
            setPreviousCondition(data.condition as ArtistCondition);
        })
        .catch(() => {});
    }
  }, []);

  const lastSyncedDataRef = useRef<UserData["data"] | null>(null);

  const enqueueAutosave = (data: UserData | null) => {
    if (!data || !sessionId) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      const diffed = diffForAutosave(
        lastSyncedDataRef.current,
        data.data,
      ) as Record<string, unknown> | undefined;

      // The server derives `completionStatus` from timeStamps/poemNumber on
      // every call, so those two (small) fields always ride along even when
      // unchanged - everything else (poem conversations, snapshots, survey
      // answers, etc.) only goes out when it actually changed.
      const partialData: Record<string, unknown> = {
        ...diffed,
        timeStamps: (data.data as { timeStamps?: unknown })?.timeStamps,
        poemNumber: (data.data as { poemNumber?: unknown })?.poemNumber,
      };

      try {
        const response = await fetch("/api/firebase/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            data: { role: data.role, data: partialData, prolific: data.prolific },
          }),
        });
        if (response.ok) {
          lastSyncedDataRef.current = data.data;
        }
        // On failure, leave lastSyncedDataRef stale so the next autosave's
        // diff still includes whatever didn't make it through this time.
      } catch {
        // Network error - same as above, next attempt will resend the diff.
      }
    }, 500);
  };

  const flushSaves = () => globalSaveQueue.flush();

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
        sessionId,
        prolific,
        flushSaves,
        disableRefreshGuard,
        isTestMode,
        setIsTestMode,
        previousCondition,
      }}
    >
      <Provider>
        <div className="w-screen h-screen">
          <Toaster />
          <Router>
            <Routes>
              <Route path="/" element={<Captcha />} />
              <Route path="/consent" element={<ConsentForm />} />
              <Route path="/poem-viewer" element={<PoemViewer />} />
              {userData && (
                <>
                  <Route
                    path="/artist/pre-survey"
                    element={<AristPreSurvey />}
                  />
                  <Route
                    path="/artist/instructions"
                    element={<ArtistInstructions />}
                  />
                  <Route
                    path="/artist/step-1"
                    element={<ArtistTransitionStep1 />}
                  />
                  <Route path="/artist/tutorial" element={<ArtistTutorial />} />
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
