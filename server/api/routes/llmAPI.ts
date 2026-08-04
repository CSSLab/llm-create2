import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.LLM_KEY || "" });
const LLM_MODEL = "gpt-5.6-sol";
const GENERATION_PARAMETERS = {
  text: { verbosity: "low" as const },
  stream: true as const,
};

const router = express.Router();

router.post("/query", async (req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages, promptVersion } = req.body;

    const stream = await openai.responses.create({
      model: LLM_MODEL,
      input: messages,
      ...GENERATION_PARAMETERS,
    });

    const writeMetadata = (modelVersion: string) => {
      res.write(
        `data: ${JSON.stringify({
          type: "metadata",
          metadata: {
            model: LLM_MODEL,
            modelVersion,
            promptVersion: promptVersion || "unversioned",
            generationParameters: GENERATION_PARAMETERS,
          },
        })}\n\n`,
      );
    };

    writeMetadata(LLM_MODEL);

    for await (const event of stream) {
      if (event.type === "response.created") {
        writeMetadata(event.response.model || LLM_MODEL);
      } else if (event.type === "response.output_text.delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta })}\n\n`);

        process.stdout.write(event.delta);
      }
    }

    // Signal completion
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error("Error fetching from OpenAI:", err);
    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: "The model request failed.",
        })}\n\n`,
      );
      res.end();
    } else {
      res.status(500).json({ error: "Something went wrong." });
    }
  }
});

export default router;
