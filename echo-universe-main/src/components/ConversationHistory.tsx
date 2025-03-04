
import { useRef, useEffect } from "react";
import { Message } from "@/types/api";

interface ConversationHistoryProps {
  conversation: Message[];
}

const ConversationHistory = ({ conversation }: ConversationHistoryProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  if (conversation.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to Echo Universe</h2>
        <p className="text-gray-500 max-w-md">
          Your voice assistant powered by LiveKit, Deepgram, ElevenLabs, and Groq.
          Press the microphone button below to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
      {conversation.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              message.role === "user"
                ? "bg-purple-100 text-purple-900"
                : "bg-white text-gray-800 border border-gray-200"
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ConversationHistory;
