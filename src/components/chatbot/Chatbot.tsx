import { Textarea } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import type { Message } from "../../types";
import { Role } from "../../types";
import { nanoid } from "nanoid";
import OpenAI from "openai";

const apiKey = import.meta.env.VITE_API_KEY;

export default function ChatTab() {
  const client = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [input, setInput] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLLMLoading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const artistMessage: Message = {
      id: nanoid(),
      role: Role.ARTIST,
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, artistMessage]);
    setInput("");
    setIsLLMLoading(true); // start typing animation

    try {
      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: input,
      });

      const llmMessage: Message = {
        id: nanoid(),
        role: Role.LLM,
        text: response.output_text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, llmMessage]);
    } catch (error) {
      console.error("LLM response failed", error);
    } finally {
      setIsLLMLoading(false); // stop typing animation
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        sendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto overflow-hidden">
      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto w-full p-4 bg-white space-y-3"
        ref={chatContainerRef}
      >
        {messages.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <p className="text-h1 text-lg text-grey">LLM Assistant</p>
            <p className="text-main text-grey text-center text-sm ">
              Start chatting with the LLM
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`py-2 rounded-lg transition-all duration-300 ease-out opacity-0 translate-y-2 animate-fade-in 
            ${
              msg.role === Role.ARTIST
                ? "px-4 bg-light-grey-2 bg-opacity-40 justify-self-end self-end text-right w-max"
                : "self-start text-left"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {isLLMLoading && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
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
            onKeyDown={handleKeyDown}
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
