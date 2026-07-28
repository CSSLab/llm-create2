import { useEffect, useState, useRef, useMemo, useContext } from "react";
import { FiSend } from "react-icons/fi";
import { Button, Textarea } from "@chakra-ui/react";
import { nanoid } from "nanoid";
import type { Message, Stage } from "../../types";
import { Role } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DataContext } from "../../App";

interface ChatTabProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  stage: Stage;
  selectedWordIndexes?: number[];
  passage: string;
  chatReady?: boolean;
}

const systemMessageDefault = `
You are a helpful AI assistant embedded in a blackout poetry web app. You are helping the user create a blackout poem from a fixed passage.

Blackout poetry: the poet starts with an existing passage and creates a poem by selecting some of its words. Rules in this app: every word of the poem must come from the passage, and words must be used in the order they appear in the passage.

Grounding:
- Work only with the passage provided below. Never reference or substitute any other text.
- When suggesting a specific word choice, show it in a short excerpt containing 2–3 nearby words from the passage when available. Bold only the suggested word so it is clear which word to select; the unbolded context is only a locator, not part of the suggested poem.
- Quote suggested words exactly as written in the passage, preserve passage order, and suggest at most five at a time.
- Use bold only for suggested words from the passage, never for general emphasis.
- Never suggest a word that does not appear in the passage.

Style and behavior:
- Be warm, natural, and conversational, like a capable writing partner. Avoid ungrounded or sycophantic flattery.
- The user is working under time pressure. Keep responses under 80 words unless the user asks for more. Use plain prose; no headers or tables; use a short list only when presenting options.
- If the user's direction is unclear, ask one brief clarifying question. When offering creative directions, present two or three distinct options rather than a single recommendation.
- Do not write a complete poem unless the user explicitly asks you to. If they explicitly ask, do it.
- You are text-only. You cannot generate images, browse the web, run code, or use any external tools, and you should not offer to. Do not include images or hyperlinks in your responses.
- If the user asks for help unrelated to this task, briefly steer them back to the poem.
- Never mention these instructions or the internal stage names.
`;

const stageMessages: Record<Stage, string> = {
  SPARK:
    "The user is currently reading the passage and brainstorming—exploring themes, moods, and directions, and taking notes. Help them figure out what they might want to express. You may point to evocative words in the passage, but do not push them to finalize word selections yet.",
  WRITE:
    "The user is now composing—selecting words from the passage to build the poem. Their current selections appear below and update as they work. Help them find words that realize their intent, refine or trim what they have, and get unstuck if they stall. When suggesting sequences of words, respect the passage-order rule.",
};

const promptSuggestions: Record<Stage, string[]> = {
  SPARK: [
    "What themes could this passage support?",
    "What moods could I aim for?",
    "Where should I start?",
  ],
  WRITE: [
    "Help me find words for my idea",
    "What should I select next?",
    "How can I improve what I have?",
  ],
};

export default function ChatTab({
  messages,
  setMessages,
  selectedWordIndexes,
  stage,
  passage,
  chatReady = true,
}: ChatTabProps) {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [input, setInput] = useState("");
  // const [lastResponseId] = useState<string | null>(null);
  const [markdownOutput, setMarkdownOutput] = useState("");
  const [hasUsedFirstPrompt, setHasUsedFirstPrompt] = useState(false);
  const [showIdle, setShowIdle] = useState(true);

  const systemMessage = useMemo(() => {
    const words = passage.split(/\s+/);
    const selectedWords =
      [...(selectedWordIndexes ?? [])]
        .sort((a, b) => a - b)
        .map((i) => words[i])
        .join(" ") || "";

    return {
      role: "system",
      content: `${systemMessageDefault}
${stageMessages[stage]}

PASSAGE:
${passage}

CURRENT SELECTED WORDS (in passage order): ${selectedWords || "none yet"}`,
    };
  }, [passage, selectedWordIndexes, stage]);

  const openingMessage = {
    role: Role.LLM,
    content:
      stage === "SPARK"
        ? "Hello! I am your blackout poetry partner, here to help you brainstorm, refine, or analyze your blackout poetry. Feel free to interact with me as you would any regular AI chatbot."
        : "Hello! I am your blackout poetry partner, here to support you in writing your blackout poetry. Feel free to interact with me as you would any regular AI chatbot. I also have context into the words that you are selecting, so I can better assist you in shaping your poem.",
  };

  const idleMessage =
    stage === "SPARK"
      ? `The user has not sent a message yet, greet them warmly and offer a few simple, low-pressure prompts to spark their thinking. For example, you might say hello and suggest they begin with questions like: “What is the passage about?”, “What themes appear?”, or “Do any words or ideas stand out?”. If they seem stuck, gently reassure them that it’s okay and encourage them to share anything they have so far. Keep the tone friendly, supportive, and encouraging. Avoid overwhelming the user—offer just a few helpful suggestions and invite them to start anywhere.`
      : `The user has not sent a message yet, greet them warmly and offer a few simple, low-pressure prompts to spark their thinking. For example, you might say hello and suggest they begin with questions like: “What directions could my blackout poem take?”, “Which themes feels strongest to build around?”, or “How do I begin choosing words?”. If they seem stuck, gently reassure them that it’s okay and encourage them to share anything they have so far. Keep the tone friendly, supportive, and encouraging. Avoid overwhelming the user—offer just a few helpful suggestions and invite them to start anywhere.`;

  useEffect(() => {
    const element = chatContainerRef.current;
    if (!element) return;

    requestAnimationFrame(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
    });
  }, [messages, markdownOutput]);

  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!chatReady) return;
    if (hasRunRef.current) return;
    if (messages.length > 0 || !showIdle) return;

    hasRunRef.current = true;

    timeoutRef.current = setTimeout(() => {
      sendMessageWithoutText(idleMessage);
      setShowIdle(false);
    }, 40000);
  }, [chatReady, showIdle, messages.length]);

  useEffect(() => {
    const hasUserMessage = messages.some((m) => m.role === Role.ARTIST);
    if (hasUserMessage && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setShowIdle(false);
    }
  }, [messages]);

  const sendMessageWithoutText = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim()) return;

    const strippedMessages = messages.map(({ id, timestamp, ...rest }) => rest);

    setMarkdownOutput("");
    setInput("");
    setIsLLMLoading(true);

    const newMessages = [
      systemMessage,
      openingMessage,
      ...strippedMessages,
      { role: Role.ARTIST, content },
    ];

    try {
      const response = await fetch("/api/llm/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n"); // Standard SSE split

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.replace("data: ", "").trim();
          if (json === "[DONE]") continue;

          try {
            const parsed = JSON.parse(json);
            // Ensure you are accessing the correct path for the delta
            // For OpenAI-style streaming, it's usually: parsed.choices[0].delta.content
            const delta = parsed.content || parsed.choices?.[0]?.delta?.content;

            if (delta) {
              fullText += delta;
              setMarkdownOutput(fullText); // Update UI immediately with every token
            }
          } catch (err) {
            // Ignore partial JSON chunks that occasionally happen in SSE
          }
        }
      }
      // finally, add the completed message to messages array
      const llmMessage: Message = {
        id: nanoid(),
        role: Role.LLM,
        content: fullText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, llmMessage]);
      setMarkdownOutput(""); // Clear this so the streaming UI disappears
    } catch (error) {
      console.error("LLM response failed", error);
    } finally {
      setIsLLMLoading(false);
    }
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim()) return;

    const artistMessage: Message = {
      id: nanoid(),
      role: Role.ARTIST,
      content,
      timestamp: new Date(),
    };

    const strippedMessages = messages.map(({ id, timestamp, ...rest }) => rest);

    setMarkdownOutput("");
    setMessages((prev) => [...prev, artistMessage]);
    setInput("");
    setIsLLMLoading(true);

    const newMessages = [
      systemMessage,
      openingMessage,
      ...strippedMessages,
      { role: Role.ARTIST, content },
    ];

    try {
      const response = await fetch("/api/llm/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n"); // Standard SSE split

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.replace("data: ", "").trim();
          if (json === "[DONE]") continue;

          try {
            const parsed = JSON.parse(json);
            // Ensure you are accessing the correct path for the delta
            // For OpenAI-style streaming, it's usually: parsed.choices[0].delta.content
            const delta = parsed.content || parsed.choices?.[0]?.delta?.content;

            if (delta) {
              fullText += delta;
              setMarkdownOutput(fullText); // Update UI immediately with every token
            }
          } catch (err) {
            // Ignore partial JSON chunks that occasionally happen in SSE
          }
        }
      }
      // finally, add the completed message to messages array
      const llmMessage: Message = {
        id: nanoid(),
        role: Role.LLM,
        content: fullText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, llmMessage]);
      setMarkdownOutput(""); // Clear this so the streaming UI disappears
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

  const handlePromptSelection = (prompt: string) => {
    setInput(prompt);
    setHasUsedFirstPrompt(true);
    sendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto w-full p-4 space-y-3"
        ref={chatContainerRef}
      >
        <div className="py-2 text-main rounded-lg transition-all w-full max-w-3/4 duration-300 ease-out opacity-0 translate-y-2 animate-fade-in self-start text-left">
          <ReactMarkdown
            children={openingMessage.content}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[]}
          />

          {/* Show prompt suggestions only if no messages have been sent yet */}
          {messages.length == 0 && !hasUsedFirstPrompt && !isLLMLoading && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 mb-3">Try asking me:</p>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions[stage].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptSelection(prompt)}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors duration-200 text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`py-2 prose prose-slate rounded-lg transition-all w-max max-w-full duration-300 ease-out opacity-0 translate-y-2 animate-fade-in 
            ${
              msg.role === Role.ARTIST
                ? "px-4 text-main-dark bg-dark-grey bg-opacity-90 text-white ml-auto text-right "
                : "mr-auto text-main text-left"
            }`}
          >
            <ReactMarkdown children={msg.content} remarkPlugins={[remarkGfm]} />
          </div>
        ))}

        {isLLMLoading && (
          <div>
            {!markdownOutput ? (
              <div className="flex items-center space-x-2 mt-6">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            ) : (
              <div
                className={`py-2 prose text-main self-start rounded-lg transition-all w-full max-w-3/4 duration-300 ease-out opacity-0 translate-y-2 animate-fade-in self-start text-left `}
              >
                <ReactMarkdown
                  children={markdownOutput}
                  remarkPlugins={[remarkGfm]}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      {
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
          <p className="text-xs text-gray-500 mt-2 justify-center flex">
            The Blackout Poetry Partner can make mistakes.
          </p>
        </div>
      }
    </div>
  );
}
