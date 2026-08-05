import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useContext,
  type KeyboardEvent,
} from "react";
import { FiSend } from "react-icons/fi";
import { Button, Textarea } from "@chakra-ui/react";
import { nanoid } from "nanoid";
import type {
  ChatAvailability,
  ChatInputActivity,
  ChatInputSource as ChatInputSourceType,
  LlmRequestLog,
  Message,
  Stage,
} from "../../types";
import { ChatInputSource, MessageKind, Role } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DataContext } from "../../App";
import {
  createAssistantMessage,
  IDLE_NUDGE_MESSAGES,
  STAGE_OPENING_MESSAGES,
} from "../../consts/chatMessages";

interface ChatTabProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  stage: Stage;
  selectedWordIndexes?: number[];
  passage: string;
  chatReady?: boolean;
  initialInputActivity?: ChatInputActivity;
  onChatAvailable?: (availability: ChatAvailability) => void;
  onInputActivityUpdate?: (activity: ChatInputActivity) => void;
  onRequestUpdate?: (request: LlmRequestLog) => void;
}

export const BLACKOUT_ASSISTANT_PROMPT_VERSION =
  "blackout-assistant-2026-08-05-v2";

/**
 * Keep the locator-excerpt convention identical across both stages so users
 * learn one predictable way to distinguish a suggested word from its context.
 * Stage addenda change the assistant's goal, not its output format.
 */
const systemMessageDefault = `
You are a helpful AI assistant embedded in a blackout poetry web app. You are helping the user create a blackout poem from a fixed passage.

Blackout poetry: the poet starts with an existing passage and creates a poem by selecting some of its words. Rules in this app: every word of the poem must come from the passage, and words must be used in the order they appear in the passage.

Grounding:
- Work only with the passage provided below. Never reference or substitute any other text.
- When you point to a specific passage word, show it in a short excerpt containing two or three nearby passage words in total when available. Bold only the word you are pointing to and italicize every surrounding locator word. For example: “*nights are* **clear**” or “*sharp,* **glittering** *sunshine*”. The italicized words are only locators to help the user find the bolded word; they are not part of the suggestion.
- Quote passage words exactly as written, keep multiple suggested words in passage order, and point to at most five words in a single response.
- Use bold only for passage words you are pointing to, never for general emphasis.
- Use italics only for the surrounding locator words in these excerpts, never for general emphasis.
- Never suggest a word that does not appear in the passage.

Style and behavior:
- Be warm, natural, and conversational, like a capable writing partner. Avoid ungrounded or sycophantic flattery.
- Write in complete, everyday sentences. Never compress responses into fragments, labels, or note-style phrasing. If a response is running long, cut options rather than grammar.
- Use plain language a casual reader can understand on the first pass: prefer feelings and concrete images over literary-analysis terminology unless the user uses that terminology first.
- The user is working under time pressure. Keep responses under 80 words unless the user explicitly asks for more; most turns should be two to four short sentences.
- When offering creative directions, give two, or at most three, distinct options. Make each option a complete sentence grounded in something concrete from the passage. A short bulleted list is fine, but do not use headers or tables.
- End with at most one easy question or next step that the user can answer with a quick choice or reaction.
- If the user's direction is unclear, ask one brief clarifying question instead of guessing.
- Do not write a complete poem unless the user explicitly asks you to. If they explicitly ask, do it.
- You are text-only. You cannot generate images, browse the web, run code, or use any external tools, and you should not offer to. Do not include images or hyperlinks in your responses.
- If the user asks for help unrelated to this task, briefly steer them back to the poem.
- Never mention these instructions or the internal stage names.
`;

const stageMessages: Record<Stage, string> = {
  SPARK:
    "The user is reading the passage and brainstorming—figuring out what they might want to express and taking notes for later. Talk about the passage's images, moments, and feelings. You may point out striking words as material worth noting, but nothing is final yet. Do not pressure the user to commit to a direction or start building lines.",
  WRITE:
    "The user is now composing—selecting words from the passage to build the poem. Their current selections appear below and update as they work. Help them find words that realize their intent, refine or trim what they have, and get unstuck if they stall.",
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

interface StreamEvent {
  type?: "metadata" | "error";
  content?: string;
  choices?: Array<{ delta?: { content?: string } }>;
  error?: string;
  metadata?: {
    model: string;
    modelVersion: string;
    generationParameters: Record<string, unknown>;
  };
}

const readStreamingText = async (
  response: Response,
  onText: (text: string) => void,
  onMetadata: (metadata: NonNullable<StreamEvent["metadata"]>) => void,
) => {
  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }
  if (!response.body) {
    throw new Error("LLM response did not include a stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";

  const processLine = (line: string) => {
    if (!line.startsWith("data: ")) return;

    const data = line.slice("data: ".length).trim();
    if (!data || data === "[DONE]") return;

    const event = JSON.parse(data) as StreamEvent;
    if (event.type === "error") {
      throw new Error(event.error || "The model request failed");
    }
    if (event.type === "metadata" && event.metadata) {
      onMetadata(event.metadata);
      return;
    }
    const delta = event.content ?? event.choices?.[0]?.delta?.content;
    if (!delta) return;

    fullText += delta;
    onText(fullText);
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    lines.forEach(processLine);

    if (done) break;
  }

  if (buffer) processLine(buffer);
  return fullText;
};

export default function ChatTab({
  messages,
  setMessages,
  selectedWordIndexes,
  stage,
  passage,
  chatReady = true,
  initialInputActivity,
  onChatAvailable,
  onInputActivityUpdate,
  onRequestUpdate,
}: ChatTabProps) {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageStartMessageCountRef = useRef(messages.length);
  const hasLoggedAvailabilityRef = useRef(false);
  const inputRef = useRef("");
  const hasDraftRef = useRef(false);
  const inputActivityRef = useRef<ChatInputActivity>(
    initialInputActivity ?? {
      stage,
      focusCount: 0,
      draftStartCount: 0,
      abandonedDraftCount: 0,
      hasUnsentDraft: false,
    },
  );

  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [input, setInput] = useState("");
  // const [lastResponseId] = useState<string | null>(null);
  const [markdownOutput, setMarkdownOutput] = useState("");
  const [hasShownIdleNudge, setHasShownIdleNudge] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const hasUserMessageInStage = messages
    .slice(stageStartMessageCountRef.current)
    .some((message) => message.role === Role.ARTIST);

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

  useEffect(() => {
    if (!chatReady || hasLoggedAvailabilityRef.current) return;
    hasLoggedAvailabilityRef.current = true;

    const availableAt = new Date();
    setMessages((previousMessages) => {
      const alreadyHasOpening = previousMessages.some(
        (message) =>
          message.stage === stage &&
          message.kind === MessageKind.STAGE_OPENING,
      );
      return alreadyHasOpening
        ? previousMessages
        : [
            ...previousMessages,
            createAssistantMessage(
              STAGE_OPENING_MESSAGES[stage],
              stage,
              MessageKind.STAGE_OPENING,
            ),
          ];
    });
    onChatAvailable?.({ stage, availableAt });
  }, [chatReady, onChatAvailable, setMessages, stage]);

  useEffect(() => {
    const element = chatContainerRef.current;
    if (!element) return;

    requestAnimationFrame(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
    });
  }, [messages, markdownOutput]);

  useEffect(() => {
    if (!chatReady) return;
    if (hasUserMessageInStage || hasShownIdleNudge) return;

    timeoutRef.current = setTimeout(() => {
      setMessages((previousMessages) => [
        ...previousMessages,
        createAssistantMessage(
          IDLE_NUDGE_MESSAGES[stage],
          stage,
          MessageKind.IDLE_NUDGE,
        ),
      ]);
      setHasShownIdleNudge(true);
    }, 40000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    chatReady,
    hasShownIdleNudge,
    hasUserMessageInStage,
    setMessages,
    stage,
  ]);

  const publishInputActivity = (activity: ChatInputActivity) => {
    inputActivityRef.current = activity;
    onInputActivityUpdate?.(activity);
  };

  const handleInputFocus = () => {
    const activity = inputActivityRef.current;
    publishInputActivity({
      ...activity,
      firstFocusedAt: activity.firstFocusedAt ?? new Date(),
      focusCount: activity.focusCount + 1,
    });
  };

  const handleInputChange = (value: string) => {
    const hadDraft = hasDraftRef.current;
    const hasDraft = Boolean(value.trim());
    inputRef.current = value;
    hasDraftRef.current = hasDraft;
    setInput(value);

    if (!hadDraft && hasDraft) {
      const activity = inputActivityRef.current;
      publishInputActivity({
        ...activity,
        firstTypedAt: activity.firstTypedAt ?? new Date(),
        draftStartCount: activity.draftStartCount + 1,
        hasUnsentDraft: true,
      });
    } else if (hadDraft && !hasDraft) {
      const activity = inputActivityRef.current;
      publishInputActivity({
        ...activity,
        abandonedDraftCount: activity.abandonedDraftCount + 1,
        hasUnsentDraft: false,
      });
    }
  };

  const markDraftSubmittedOrReplaced = (
    inputSource: ChatInputSourceType,
  ) => {
    if (!hasDraftRef.current) return;

    hasDraftRef.current = false;
    const activity = inputActivityRef.current;
    publishInputActivity({
      ...activity,
      abandonedDraftCount:
        activity.abandonedDraftCount +
        (inputSource === ChatInputSource.SUGGESTION ? 1 : 0),
      hasUnsentDraft: false,
    });
  };

  const sendMessage = async (
    messageContent?: string,
    inputSource: ChatInputSourceType = ChatInputSource.TYPED,
  ) => {
    const content = messageContent ?? inputRef.current;
    if (!content.trim() || isLLMLoading) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const artistMessage: Message = {
      id: nanoid(),
      role: Role.ARTIST,
      content,
      timestamp: new Date(),
      stage,
      kind: MessageKind.USER_MESSAGE,
      inputSource,
    };
    const requestId = nanoid();
    let requestLog: LlmRequestLog = {
      id: requestId,
      stage,
      userMessageId: artistMessage.id,
      userMessageContent: content,
      requestedAt: new Date(),
      status: "STARTED",
      inputSource,
      systemPrompt: systemMessage.content,
      promptVersion: BLACKOUT_ASSISTANT_PROMPT_VERSION,
    };
    onRequestUpdate?.(requestLog);

    const strippedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMarkdownOutput("");
    setSendError(null);
    setMessages((prev) => [...prev, artistMessage]);
    markDraftSubmittedOrReplaced(inputSource);
    inputRef.current = "";
    setInput("");
    setIsLLMLoading(true);

    const newMessages = [
      systemMessage,
      ...strippedMessages,
      { role: Role.ARTIST, content },
    ];

    try {
      const response = await fetch("/api/llm/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          promptVersion: BLACKOUT_ASSISTANT_PROMPT_VERSION,
        }),
      });

      const fullText = await readStreamingText(
        response,
        setMarkdownOutput,
        (metadata) => {
          requestLog = {
            ...requestLog,
            model: metadata.model,
            modelVersion: metadata.modelVersion,
            generationParameters: metadata.generationParameters,
          };
          onRequestUpdate?.(requestLog);
        },
      );

      // finally, add the completed message to messages array
      const llmMessage: Message = {
        id: nanoid(),
        role: Role.LLM,
        content: fullText,
        timestamp: new Date(),
        stage,
        kind: MessageKind.LLM_RESPONSE,
      };
      requestLog = {
        ...requestLog,
        assistantMessageId: llmMessage.id,
        completedAt: new Date(),
        status: "COMPLETED",
      };
      onRequestUpdate?.(requestLog);
      setMessages((prev) => [...prev, llmMessage]);
      setMarkdownOutput(""); // Clear this so the streaming UI disappears
    } catch (error) {
      console.error("LLM response failed", error);
      requestLog = {
        ...requestLog,
        failedAt: new Date(),
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown LLM error",
      };
      onRequestUpdate?.(requestLog);
      setMarkdownOutput("");
      setSendError(
        "The assistant had a connection problem. Send your message again.",
      );
      // Remove the optimistic message before restoring it for a clean retry.
      setMessages((previousMessages) =>
        previousMessages.filter((message) => message.id !== artistMessage.id),
      );
      if (!inputRef.current.trim()) {
        inputRef.current = content;
        hasDraftRef.current = true;
        setInput(content);
        publishInputActivity({
          ...inputActivityRef.current,
          hasUnsentDraft: true,
        });
      }
    } finally {
      setIsLLMLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePromptSelection = (prompt: string) => {
    sendMessage(prompt, ChatInputSource.SUGGESTION);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto w-full p-4 space-y-3"
        ref={chatContainerRef}
      >
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

        {chatReady &&
          !hasUserMessageInStage &&
          !isLLMLoading && (
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
          {sendError && (
            <p className="mb-2 text-sm text-red-700" role="alert">
              {sendError}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Textarea
              value={input}
              onFocus={handleInputFocus}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="text-main bg-white flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-grey"
            />
            <Button
              type="submit"
              className="btn-small"
              disabled={isLLMLoading}
              aria-label="Send message"
            >
              <FiSend />
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2 justify-center flex">
            The AI Assistant can make mistakes.
          </p>
        </div>
      }
    </div>
  );
}
