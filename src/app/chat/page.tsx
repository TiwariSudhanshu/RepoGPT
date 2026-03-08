"use client";

import Navbar from "@/components/Navbar";
import { Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm RepoGPT. Ask me anything about the repository you're analyzing. I'll retrieve relevant code and provide detailed answers.",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "This is a simulated response. In a real implementation, this would be replaced with actual AI-generated responses based on the repository's code analysis. The AI would retrieve relevant code snippets and provide meaningful answers to your questions.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <main className="w-full h-screen bg-gradient-to-b from-black via-neutral-950 to-black flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-4xl mx-auto w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-2xl px-6 py-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-100"
                  }`}
                >
                  <p className="leading-relaxed text-sm md:text-base">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-6 py-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  <span className="text-sm text-neutral-400">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-neutral-800 bg-black/50 backdrop-blur-md p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about this repository..."
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar - Repository Info */}
        <div className="hidden lg:flex lg:w-80 border-l border-neutral-800 bg-black/50 flex-col">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-2">
              Repository Info
            </h3>
            <p className="text-sm text-neutral-500">
              Connected repository details
            </p>
          </div>

          <div className="p-6 space-y-6 flex-1">
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Repository Name
              </label>
              <p className="text-white font-medium mt-2">owner/repository</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Indexing Status
              </label>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-white text-sm">Indexed</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Files Analyzed
              </label>
              <p className="text-white font-medium mt-2">247</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Total Size
              </label>
              <p className="text-white font-medium mt-2">2.4 MB</p>
            </div>

            <button className="w-full py-2 mt-4 text-sm border border-neutral-800 rounded-lg text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors">
              Switch Repository
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
