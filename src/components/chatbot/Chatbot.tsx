import { Textarea } from "@chakra-ui/react";
import { useState } from "react";
import type { Message } from "../../types";
import { Role } from "../../types";
import { nanoid } from "nanoid";
import OpenAI from "openai";

const apiKey = import.meta.env.VITE_API_KEY;

export default function ChatTab() {
  const client = new OpenAI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const artistMessage: Message = {
      id: nanoid(),
      role: Role.ARTIST,
      text: input,
      timestamp: new Date(),
    };

    const response = await client.responses.create({
      model: "gpt-4.1",
      input: input,
    });

    const llmMessage: Message = {
      id: nanoid(),
      role: Role.LLM,
      text: response.output_text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, artistMessage, llmMessage]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto w-full p-4 bg-white space-y-3">
        {messages.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <p className="text-h1 text-lg text-grey">LLM Assistant</p>
            <p className="text-main text-grey text-center text-sm ">
              Start chatting with the LLM
            </p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`py-2 rounded-lg ${
              msg.role === Role.ARTIST
                ? "px-4 bg-light-grey-2 bg-opacity-40 justify-self-end self-end text-right w-max"
                : "self-start text-left"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="text-main flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-grey"
          />
          <button
            type="submit"
            className="px-4 h-max py-2 bg-grey text-white rounded-md hover:bg-opacity-70"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
