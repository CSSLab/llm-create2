import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.VITE_LLM_KEY || "" });

const router = express.Router();

router.post("/query", async (req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      stream: true,
    });

    for await (const chunk of completion) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    // Signal completion
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error("Error fetching from OpenAI:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
