"use client";

import Navbar from "@/components/Navbar";
import { Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { analyzeRepository, askQuestion } from "@/lib/api";
import { getApiKey } from "@/lib/apiKeyStorage";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function ChatPage() {
  const searchParams = useSearchParams();

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
  const [repoOwner, setRepoOwner] = useState(searchParams.get("owner") || "");
  const [repoName, setRepoName] = useState(searchParams.get("repo") || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRepositoryIndexed, setIsRepositoryIndexed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (!isRepositoryIndexed) {
      toast.warning(
        "Please analyze a repository first before asking questions.",
      );
      return;
    }

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

    try {
      const storedApi = getApiKey();

      if (!storedApi) {
        throw new Error(
          "No API key found. Please configure your API key in the API Keys settings.",
        );
      }

      // Sanitize collection name to match backend
      const sanitizedCollectionName = `${repoOwner}-${repoName}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const response = await askQuestion({
        owner: repoOwner,
        repo: repoName,
        question: userMessage.content,
        provider: storedApi.provider,
        model: storedApi.model,
        api_key: storedApi.apiKey,
        collection_name: sanitizedCollectionName,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Error asking question:", error);

      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Error: ${errorMessage}`,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeRepository = async () => {
    console.log("Analyze button clicked", { repoOwner, repoName });

    if (!repoOwner.trim() || !repoName.trim()) {
      console.warn("Missing repo details");
      toast.error("Please enter both repository owner and name");
      return;
    }

    // Only access localStorage on client side
    if (typeof window === "undefined") {
      console.warn("Not in browser environment");
      toast.error("This feature only works in the browser");
      return;
    }

    console.log("Attempting to retrieve API key...");
    const storedApi = getApiKey(); // Get last used provider automatically

    if (!storedApi) {
      console.error("❌ No API key found in localStorage");
      toast.error(
        "No API key saved! Click 'API Keys' in the navbar to add one.",
      );
      return;
    }

    console.log("✅ API key found:", {
      provider: storedApi.provider,
      model: storedApi.model,
    });

    setIsAnalyzing(true);
    try {
      // Sanitize collection name: lowercase and replace invalid chars with hyphens
      const sanitizedCollectionName = `${repoOwner}-${repoName}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-") // Remove consecutive hyphens
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

      const response = await analyzeRepository({
        owner: repoOwner,
        repo: repoName,
        provider: storedApi.provider,
        api_key: storedApi.apiKey,
        collection_name: sanitizedCollectionName,
      });

      setIsRepositoryIndexed(true);
      toast.success(
        `Repository indexed! ${response.chunks_indexed} chunks ready.`,
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `✅ Repository **${repoOwner}/${repoName}** indexed successfully! **${response.chunks_indexed} chunks** indexed. You can now ask questions about this repository.`,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error analyzing repository:", error);
      toast.error(`Failed to analyze: ${errorMessage}`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `❌ Failed to analyze repository: ${errorMessage}`,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
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
                  {message.role === "user" ? (
                    <p className="leading-relaxed text-sm md:text-base">
                      {message.content}
                    </p>
                  ) : (
                    <div
                      className="prose prose-invert prose-sm md:prose-base max-w-none
                      prose-headings:text-white prose-headings:font-semibold
                      prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                      prose-p:text-neutral-200 prose-p:leading-relaxed prose-p:my-2
                      prose-strong:text-white prose-strong:font-semibold
                      prose-em:text-neutral-300
                      prose-code:text-blue-300 prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-neutral-700 prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-3 prose-pre:overflow-x-auto
                      prose-pre:text-xs
                      prose-ul:my-2 prose-ul:space-y-1 prose-li:text-neutral-200 prose-li:my-0
                      prose-ol:my-2 prose-ol:space-y-1
                      prose-blockquote:border-l-blue-500 prose-blockquote:text-neutral-400 prose-blockquote:my-2
                      prose-hr:border-neutral-700
                      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                      prose-table:text-sm prose-th:text-neutral-300 prose-td:text-neutral-300
                    "
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
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
                Repository Owner
              </label>
              <input
                type="text"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
                placeholder="e.g., facebook"
                className="w-full mt-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Repository Name
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="e.g., react"
                className="w-full mt-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isAnalyzing}
              />
            </div>

            <button
              onClick={handleAnalyzeRepository}
              disabled={isAnalyzing || !repoOwner.trim() || !repoName.trim()}
              className="w-full py-2 mt-4 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isAnalyzing ? "Analyzing..." : "Analyze Repository"}
            </button>

            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase">
                Indexing Status
              </label>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isRepositoryIndexed
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-500"
                  }`}
                />
                <p className="text-white text-sm">
                  {isRepositoryIndexed ? "Indexed" : "Not indexed"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
