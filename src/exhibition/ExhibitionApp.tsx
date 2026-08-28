import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ExhibitionGallery from "./components/ExhibitionGallery";
import PoemDetailRoute from "./components/PoemDetail";
import type { ExhibitionDataset } from "./types";
import "./exhibition.css";

const DEFAULT_STUDY_ID = "6a8cbdb524cc2e2b32049b00";
const STUDY_ID =
  import.meta.env.VITE_EXHIBITION_STUDY_ID?.trim() || DEFAULT_STUDY_ID;
const DATA_URL =
  import.meta.env.VITE_EXHIBITION_DATA_URL?.trim() ||
  `/api/firebase/exhibition?studyId=${encodeURIComponent(STUDY_ID)}`;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ExhibitionRoutes({ dataset }: { dataset: ExhibitionDataset }) {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/exhibition" element={<ExhibitionGallery dataset={dataset} />} />
        <Route
          path="/exhibition/:participantId"
          element={<PoemDetailRoute dataset={dataset} />}
        />
      </Routes>
    </>
  );
}

export default function ExhibitionApp() {
  const [dataset, setDataset] = useState<ExhibitionDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Blackout Room";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(DATA_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Data request failed (${response.status})`);
        const payload = (await response.json()) as ExhibitionDataset;
        setDataset(payload);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        if (import.meta.env.DEV) {
          const { previewDataset } = await import("./data/preview");
          setDataset(previewDataset);
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The exhibition data could not be loaded.",
        );
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <main className="ex-status-page">
        <p className="ex-status-page__mark">✦</p>
        <h1>The exhibition is between states.</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!dataset) {
    return (
      <main className="ex-status-page" aria-live="polite">
        <p className="ex-status-page__mark ex-status-page__mark--turning">✦</p>
        <p>Preparing the room…</p>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <ExhibitionRoutes dataset={dataset} />
    </BrowserRouter>
  );
}
