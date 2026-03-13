"use client";

import Link from "next/link";
import {
  Github,
  Code2,
  X,
  Key,
  ChevronDown,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { saveApiKey, getApiKey } from "@/lib/apiKeyStorage";
import { toast } from "sonner";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    id: "gemini",
    name: "Gemini",
    models: ["models/gemini-2.5-flash", "models/gemini-2.5-pro"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-3-5"],
  },
];

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [selectedModel, setSelectedModel] = useState(PROVIDERS[0].models[0]);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    setHasApiKey(!!getApiKey());
  }, []);

  const handleProviderChange = (providerId: string) => {
    const provider = PROVIDERS.find((p) => p.id === providerId)!;
    setSelectedProvider(provider);
    setSelectedModel(provider.models[0]);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setApiKey("");
    setShowKey(false);
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.warning("Please enter an API key");
      return;
    }

    try {
      saveApiKey(selectedProvider.id, selectedModel, apiKey);
      const verified =
        typeof window !== "undefined"
          ? localStorage.getItem(`repo-gpt-api-key-${selectedProvider.id}`)
          : null;

      if (verified) {
        setHasApiKey(true);
        toast.success(`${selectedProvider.name} API key saved!`, {
          description: `Model: ${selectedModel}`,
        });
        handleClose();
      } else {
        toast.error("API key was not saved. Check console for details.");
      }
    } catch (error) {
      toast.error(
        `Error saving API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">RepoGPT</span>
          </Link>

          {/* Right Navigation */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-neutral-300 hover:text-white transition-colors text-sm font-medium"
            >
              Home
            </Link>
            <Link
              href="/chat"
              className="text-neutral-300 hover:text-white transition-colors text-sm font-medium"
            >
              Chat
            </Link>
            <a
              href="https://github.com/owner/repository"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              {hasApiKey ? (
                <CheckCircle className="w-4 h-4 text-green-300" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              API Keys
            </button>
          </div>
        </div>
      </nav>

      {/* API Keys Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-base">
                    API Keys
                  </h2>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Configure your AI provider credentials
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderChange(provider.id)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${
                        selectedProvider.id === provider.id
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/50 text-white"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                      }`}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Model
                </label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer pr-10"
                  >
                    {selectedProvider.models.map((model) => (
                      <option
                        key={model}
                        value={model}
                        className="bg-neutral-900"
                      >
                        {model}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${selectedProvider.name} API key...`}
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 transition-colors pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  Your key is stored locally and never sent to our servers.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!apiKey.trim()}
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
