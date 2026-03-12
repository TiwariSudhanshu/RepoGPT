"use client";

/**
 * API service for RepoGPT backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalyzeRequest {
  owner: string;
  repo: string;
  provider: string;
  api_key: string;
  embed_api_key?: string;
  collection_name?: string;
  github_token?: string;
}

export interface AnalyzeResponse {
  status: string;
  message: string;
  owner: string;
  repo: string;
  collection_name: string;
  chunks_indexed: number;
}

export interface AnswerRequest {
  owner: string;
  repo: string;
  question: string;
  provider: string;
  model: string;
  api_key: string;
  embed_api_key?: string;
  collection_name?: string;
}

export interface AnswerResponse {
  answer: string;
  question: string;
  provider: string;
  model: string;
}

/**
 * Analyze a GitHub repository
 * Loads the repo, chunks it, and indexes it into Pinecone
 */
export async function analyzeRepository(
  request: AnalyzeRequest,
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `Failed to analyze repository: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Ask a question about an analyzed repository
 * Uses the RAG index to find relevant code and generate an answer
 */
export async function askQuestion(
  request: AnswerRequest,
): Promise<AnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `Failed to get answer: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Check if the backend is running
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
