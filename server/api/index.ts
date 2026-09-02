import express from "express";
import cors from "cors";
import llmRoutes from "./routes/llmAPI";
import firebaseRoutes from "./routes/firebaseAPI";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 8080;

// Sessions accumulate chat history and edit snapshots, so the default 100kb
// body-parser limit gets hit well before anything is actually wrong. Raised
// as a safety net; the autosave payload itself is also diffed down to just
// the sections that changed (see `enqueueAutosave` in src/App.tsx).
app.use(express.json({ limit: "5mb" }));

// ===== API ROUTES =====
app.use("/api/llm", llmRoutes);
app.use("/api/firebase", firebaseRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
