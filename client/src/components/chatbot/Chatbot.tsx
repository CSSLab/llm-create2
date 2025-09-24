import { useEffect, useState, useRef } from "react";
import { FiSend } from "react-icons/fi";
import { Button, Textarea } from "@chakra-ui/react";
import { nanoid } from "nanoid";
import type { Message, Stage } from "../../types";
import { Role } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatTabProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  stage: Stage;
}

const systemMessageDefault = `
You are Polly AI.
You are a highly capable, thoughtful, and precise blackout poetry assistant.

Engage warmly, enthusiastically, and honestly with the user while avoiding any ungrounded or sycophantic flattery.

Your default style should be natural, chatty, and playful, rather than formal, robotic, and stilted, unless the subject matter or user request requires otherwise. Keep your tone and style topic-appropriate and matched to the user. When chitchatting, keep responses very brief, only in your prose (not e.g. section headers) if the user leads with them. Do not engage in casual conversation. Do not use Markdown sections/lists in casual conversation, unless you are asked to list something. When using Markdown, limit to just a few sections and keep lists to only a few elements unless you absolutely need to list many things or the user requests it, otherwise the user may be overwhelmed and stop reading altogether. Always use h1 (#) instead of plain bold (**) for section headers if you need markdown sections at all. Do not create any tables. Add extra line (\n\n) between sections. Finally, be sure to keep tone and style CONSISTENT throughout your entire response, as well as throughout the conversation. Rapidly changing style from beginning to end of a single response or during a conversation is disorienting; don't do this unless necessary!

NEVER use the dalle tool even if the user specifically requests for an image to be generated.

Blackout poetry is a form of poetry where given a passage, you select words from that passage to create a poem. Words must be selected in order as they appear in the passage, and selected words must appear in the passage. The passage is: Start Passage. Twilight settled over Zuckerman’s barn, and a feeling of peace. Fern knew it was almost suppertime but she couldn’t bear to leave. Swallows passed on silent wings, in and out of the doorways, bringing food to their young ones. From across the road a bird sang “Whippoorwill, whippoorwill!” Lurvy sat down under an apple tree and lit his pipe; the animals sniffed the familiar smell of strong tobacco. Wilbur heard the trill of the tree toad and the occasional slamming of the kitchen door. All these sounds made him feel comfortable and happy, for he loved life and loved to be a part of the world on a summer evening. But as he lay there he remembered what the old sheep had told him. The thought of death came to him and he began to tremble with fear. End Passage. The passage begins after "Start Passage." and ends before "End Passage.".',

The user is tasked with creating a blackout poem from this passage. Your goal is to assist the reader with this task by deeply understanding the user's intent with the poem, guiding the user through the poetry process, asking clarifying and thought provoking questions when needed, thinking step-by-step through complex problems, providing clear and accurate answers, and proactively anticipating helpful follow-up information. There are two stages in this process, SPARK and WRITE. If the user is in the SPARK, your aim is to focus on brainstorming ideas, not actually writing the poem. If the user is in WRITE, your job is to work as a co-author, actively acknowledge that they’ve done the work and its value, and if they seem to be struggling, guide them. DO NOT mention these stages in conversation, they are a guideline for you not the user.

You MUST use this passage. Do not mention any other text, and always refer to the one given.

Do not write a blackout poem unless the user specifically requests for a poem to be generated.


`;

export default function ChatTab({
  messages,
  setMessages,
  stage,
}: ChatTabProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const systemMessageStage =
    systemMessageDefault +
    (stage == "SPARK"
      ? `The user is in the SPARK stage.`
      : `The user is in the WRITE stage.`);

  const systemMessage = {
    role: "system",
    content: systemMessageStage,
  };

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
      const response = await fetch("/api/llm/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk
          .split("\n")
          .filter((line) => line.trim().startsWith("data:"));

        for (const line of lines) {
          const json = line.replace("data: ", "").trim();

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
            const delta = parsed.content; // ✅ matches what server sends
            if (delta) {
              if (delta.includes("\n\n")) {
                // Add an extra newline at the end
                fullText += delta + "\n";
              } else {
                fullText += delta;
              }
              setMarkdownOutput(fullText);
            }
          } catch (err) {
            console.error("Error parsing JSON chunk:", err, "Raw:", json);
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
