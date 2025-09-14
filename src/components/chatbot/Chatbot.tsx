import { useEffect, useState, useRef } from "react";
import { FiSend } from "react-icons/fi";
import { Button, Textarea } from "@chakra-ui/react";
import { nanoid } from "nanoid";
// import OpenAI from "openai";
import type { Message } from "../../types";
import { Role } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import { system } from "@chakra-ui/react/preset";

interface ChatTabProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const systemMessage = {
  role: "system",
  content:
    'You are a helpful blackout poetry assistant. Blackout poetry is a form poetry where given a passage, you select words from that passage to create a poem. Words must be selected in order as they appear in the passage, and selected words must appear in the passage. The passage is: Start Passage. Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear. End Passage. The passage begins after "Start Passage." and ends before "End Passage.".',
};

export default function ChatTab({ messages, setMessages }: ChatTabProps) {
  const apiKey = import.meta.env.VITE_LLM_KEY;
  // const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [input, setInput] = useState("");
  // const [lastResponseId] = useState<string | null>(null);
  const [markdownOutput, setMarkdownOutput] = useState("");

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
      content: input,
      timestamp: new Date(),
    };

    const strippedMessages = messages.map(({ id, timestamp, ...rest }) => rest);

    setMarkdownOutput("");
    setMessages((prev) => [...prev, artistMessage]);
    setInput("");
    setIsLLMLoading(true); // start typing animation
    const newMessages = [
      systemMessage,
      ...strippedMessages,
      { role: Role.ARTIST, content: input },
    ];

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: newMessages,
            stream: true,
            store: true,
          }),
        }
      );

      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n")
          .filter((line) => line.trim().startsWith("data:"));

        for (const line of lines) {
          const json = line.replace("data: ", "");
          if (json === "[DONE]") {
            const llmMessage: Message = {
              id: nanoid(),
              role: Role.LLM,
              content: fullText,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, llmMessage]);
            return;
          }

          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices[0].delta.content;
            if (delta) {
              fullText += delta;
              setMarkdownOutput(fullText);
            }
          } catch (err) {
            console.error("Error parsing JSON chunk:", err);
          }
        }
      }
    } catch (error) {
      console.error("LLM response failed", error);
    } finally {
      setIsLLMLoading(false);
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
            className={`py-2 rounded-lg transition-all w-max max-w-full duration-300 ease-out opacity-0 translate-y-2 animate-fade-in 
            ${
              msg.role === Role.ARTIST
                ? "px-4 bg-dark-grey bg-opacity-90 text-white justify-self-end self-end text-right "
                : "self-start text-left"
            }`}
          >
            <ReactMarkdown
              children={msg.content}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[]}
            />
          </div>
        ))}

        {isLLMLoading && (
          <div>
            {!markdownOutput ? (
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            ) : (
              <div
                className={`py-2 rounded-lg transition-all w-full max-w-3/4 duration-300 ease-out opacity-0 translate-y-2 animate-fade-in self-start text-left `}
              >
                <ReactMarkdown
                  children={markdownOutput}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[]}
                />
              </div>
            )}
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
