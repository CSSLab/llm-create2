import { useEffect, useState, useRef } from "react";
import { FiSend } from "react-icons/fi";
import { Button, Textarea } from "@chakra-ui/react";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import type { Message } from "../../types";
import { Role } from "../../types";

interface ChatTabProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function ChatTab({ messages, setMessages }: ChatTabProps) {
  const apiKey = import.meta.env.VITE_LLM_KEY;
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [input, setInput] = useState("");
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);

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
        model: "gpt-5-nano",
        store: true,
        input: [{ role: "user", content: input }],
        ...(lastResponseId ? { previous_response_id: lastResponseId } : {}),
      });

      setLastResponseId(response.id);

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto overflow-hidden">
      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto w-full p-4 space-y-3"
        ref={chatContainerRef}
      >
        {messages.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <p className="text-h1 text-lg text-grey">Blackout Assistant</p>
            <p className="text-main text-grey text-center text-sm ">
              Start chatting with the assistant
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`py-2 rounded-lg transition-all duration-300 ease-out opacity-0 translate-y-2 animate-fade-in 
            ${
              msg.role === Role.ARTIST
                ? "px-4 bg-dark-grey bg-opacity-90 text-white justify-self-end self-end text-right w-max"
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
            className="text-main bg-white flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-grey"
          />
          <Button className="btn-small" onClick={() => sendMessage()}>
            <FiSend />
          </Button>
        </form>
      </div>
    </div>
  );
}
