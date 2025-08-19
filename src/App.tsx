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
import ChooseYourCharacter from "./pages/ChooseYourCharacter";
import AudiencePreSurvey from "./pages/audience/PreSurvey";
import AudienceInstructions from "./pages/audience/instructions/Instructions";
import AudienceTransitionStep1 from "./pages/audience/step1/TransitionStep1";
import AudienceStep1 from "./pages/audience/step1/Step1";
import AudienceStep2 from "./pages/audience/step2/Step2";
import AudienceTransitionStep2 from "./pages/audience/step2/TransitionStep2";
import AudiencePostSurvey from "./pages/audience/PostSurvey";
import { useState, createContext } from "react";
import type { UserData, Artist, Audience, ArtistSurvey, AudienceSurvey } from "./types";
import { Provider } from "./components/ui/provider";

interface DataContextValue {
  userData: UserData | null;
  addUserData: (newData: Partial<UserData>) => void;
  addRoleSpecificData: (updates: Partial<Artist> | Partial<Audience>) => void;
  addPreSurvey: (updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>) => void;
  addPostSurvey: (updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>) => void;
}

export const DataContext = createContext<DataContextValue | null>(null);

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);

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
    updates: Partial<Artist> | Partial<Audience>
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error(
          "Tried to update data when userData is null or incomplete."
        );
      }

      return {
        ...prev,
        data: {
          ...prev.data,
          ...updates,
        },
      };
    });
  };

    const addPreSurvey = (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update pre-survey when userData is null.");
      }

      return {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            preSurvey: {
              ...(prev.data.surveyResponse?.preSurvey || {}),
              ...(updates.preSurvey || {}),
            },
          },
        },
      };
    });
  };

  const addPostSurvey = (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update post-survey when userData is null.");
      }

      return {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            postSurvey: {
              ...(prev.data.surveyResponse?.postSurvey || {}),
              ...(updates.postSurvey || {}),
            },
          },
        },
      };
    });
  };

  return (
    <DataContext.Provider
      value={{ userData, addUserData, addRoleSpecificData, addPostSurvey, addPreSurvey }}
    >
      <Provider>
        <div className="w-screen h-screen">
          <Router>
            <Routes>
              <Route path="/" element={<Captcha />} />
              <Route path="/consent" element={<ConsentForm />} />

              <Route path="/artist/pre-survey" element={<AristPreSurvey />} />
              <Route
                path="/audience/pre-survey"
                element={<AudiencePreSurvey />}
              />

              <Route
                path="/artist/instructions"
                element={<ArtistInstructions />}
              />
              <Route
                path="/audience/instructions"
                element={<AudienceInstructions />}
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
                path="/artist/post-survey"
                element={<ArtistPostSurvey />}
              />
              <Route
                path="/audience/post-survey"
                element={<AudiencePostSurvey />}
              />

              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/choice" element={<ChooseYourCharacter />} />
            </Routes>
          </Router>
        </div>
      </Provider>
    </DataContext.Provider>
  );
}

export default App;
