import { Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";

interface Message {
  from: "user" | "bot";
  text: string;
}

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = { from: "user", text: input };
    const botMessage: Message = { from: "bot", text: `You said: "${input}"` };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto w-full p-4 space-y-3">
        {messages.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <p className="text-h1 text-lg text-grey">Blackout Assistant</p>
            <p className="text-main text-grey text-center text-sm ">
              Start chatting with the assistant
            </p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`py-2 rounded-lg ${
              msg.from === "user"
                ? "px-4 bg-dark-grey bg-opacity-90 text-white justify-self-end self-end text-right w-max"
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
            className="text-main bg-white flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-grey"
          />
          <Button className="btn-small" onClick={() => sendMessage()}>
            <FiSend />
          </Button>

          {/* <button
                  type="submit"
                  className="px-4 h-max py-2 bg-grey text-white rounded-md hover:bg-opacity-70"
                >
                  Send
                </button> */}
        </form>
      </div>
    </div>
  );
}
