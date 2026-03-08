"use client";

import Link from "next/link";
import { Code2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black/50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">RepoGPT</span>
            </Link>
            <p className="text-neutral-400 text-sm">
              AI powered GitHub repository explorer.
            </p>
          </div>

          {/* Links Section */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  Chat
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Developer</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/owner/repository"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  API Keys
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-xs">
            © 2026 RepoGPT. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="https://github.com/owner/repository"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors text-sm"
            >
              GitHub
            </a>
            <Link
              href="/chat"
              className="text-neutral-400 hover:text-white transition-colors text-sm"
            >
              Documentation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
