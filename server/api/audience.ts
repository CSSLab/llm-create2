// Audience-only local server: cached interpretations do not need a live LLM key.
import express from "express";
import firebaseRoutes from "./routes/firebaseAPI";

const app = express();
app.use(express.json());
app.use("/api/firebase", firebaseRoutes);
app.listen(Number(process.env.PORT || 8080), "127.0.0.1", () => {
  console.log(`Audience API ready at http://127.0.0.1:${process.env.PORT || 8080}`);
});
