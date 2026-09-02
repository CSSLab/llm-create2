import express from "express";
import cors from "cors";
import llmRoutes from "./routes/llmAPI";
import firebaseRoutes from "./routes/firebaseAPI";
import { JSON_BODY_LIMIT } from "./config";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 8080;

// Creator sessions legitimately exceed Express's 100 KB default. Autosaves
// are diffed and final saves are compact, while this preserves the existing
// safety margin and supports older clients that still send complete sessions.
app.use(express.json({ limit: JSON_BODY_LIMIT }));

// ===== API ROUTES =====
app.use("/api/llm", llmRoutes);
app.use("/api/firebase", firebaseRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
