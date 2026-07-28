import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.LLM_KEY || "" });

const router = express.Router();

router.post("/query", async (req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages } = req.body;

    const stream = await openai.responses.create({
      model: "gpt-5.6-sol",
      input: messages,
      text: { verbosity: "low" },
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta })}\n\n`);

        process.stdout.write(event.delta);
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
