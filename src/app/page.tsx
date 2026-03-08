"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Github, ArrowRight, Database, Zap, Brain } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent leading-tight">
              RepoGPT
            </h1>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Ask questions about any GitHub repository using AI-powered
              retrieval
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-6 pt-8">
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="flex-1 px-6 py-4 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap">
                <span>Analyze Repository</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Help Text */}
            <p className="text-sm text-neutral-500">
              Enter any public GitHub repository URL to get started
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            How RepoGPT Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 to-black hover:border-neutral-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:from-blue-500/30 group-hover:to-purple-600/30 transition-colors">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Fetch Repository
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                RepoGPT retrieves repository files using the GitHub API.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 to-black hover:border-neutral-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:from-blue-500/30 group-hover:to-purple-600/30 transition-colors">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Index the Code
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                Files are chunked and converted into embeddings stored in a
                vector database.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 to-black hover:border-neutral-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:from-blue-500/30 group-hover:to-purple-600/30 transition-colors">
                <Brain className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Ask Questions
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                Relevant code is retrieved and sent to an AI model to generate
                answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
