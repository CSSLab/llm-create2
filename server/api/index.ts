import express from "express";
import cors from "cors";
import llmRoutes from "./routes/llmAPI";
import firebaseRoutes from "./routes/firebaseAPI";
import { JSON_BODY_LIMIT } from "./config";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 8080;

// Detailed creator interaction logs can legitimately exceed Express's 100 KB
// default. The client also sends a compact payload, while this remains a safe
// ceiling for unusually active sessions and backward-compatible old clients.
app.use(express.json({ limit: JSON_BODY_LIMIT }));

// ===== API ROUTES =====
app.use("/api/llm", llmRoutes);
app.use("/api/firebase", firebaseRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
