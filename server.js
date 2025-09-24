import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import llmRoutes from "./server/routes/llmAPI.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ===== API ROUTES =====
app.use(express.json());

// ===== SERVE VITE REACT BUILD =====
const buildPath = path.join(__dirname, "client", "dist");
app.use(express.static(buildPath));

app.use("/api/llm", llmRoutes);

// All routes that are not the one listed above redirect to the React app
app.get("{*splat}", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

app.on("error", (err) => {
  console.error("Server error:", err);
});
