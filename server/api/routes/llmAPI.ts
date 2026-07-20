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

router.post(
  "/generate-overview",
  async (req: express.Request, res: express.Response) => {
    try {
      const { passageText, selectedWordIndexes } = req.body;
      if (!passageText || !selectedWordIndexes) {
        return res
          .status(400)
          .json({ error: "Missing passageText or selectedWordIndexes" });
      }

      const words = passageText.split(" ");
      const poemWords = (selectedWordIndexes as number[])
        .map((i: number) => words[i])
        .filter(Boolean)
        .join(" ");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a literary assistant helping readers interpret blackout poetry. " +
              "Given the words selected from a passage to form a blackout poem, write a brief, " +
              "thoughtful interpretation (2–3 sentences) of the poem's meaning and mood. " +
              "Do not mention blackout poetry mechanics — focus only on the meaning conveyed by the words.",
          },
          {
            role: "user",
            content: `The poem consists of these words selected from the passage: "${poemWords}"`,
          },
        ],
      });

      const overview =
        completion.choices?.[0]?.message?.content?.trim() ?? "";
      res.json({ overview });
    } catch (err) {
      console.error("Error generating overview:", err);
      res.status(500).json({ error: "Failed to generate overview." });
    }
  }
);

export default router;
