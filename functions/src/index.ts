import * as functions from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/https";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: functions.config().openai.key,
});

export const aiResponse = onCall(async (data) => {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: data.data,
    });

    return { text: response.output_text };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err);
    throw new HttpsError("internal", err.message);
  }
});
