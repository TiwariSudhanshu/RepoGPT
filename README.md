# RepoGPT

RepoGPT is a Retrieval Augmented Generation (RAG) based developer tool that allows users to **ask questions about any GitHub repository** and receive answers grounded in the actual codebase.

Instead of manually reading hundreds of files, RepoGPT indexes the repository, retrieves the most relevant code sections, and uses a language model to explain the logic in natural language.

The goal of RepoGPT is to make **understanding unfamiliar codebases faster and easier for developers.**

---

# What RepoGPT Can Do

RepoGPT enables developers to:

* Understand large repositories quickly
* Ask questions about specific parts of the code
* Discover where important logic lives
* Get architecture explanations of projects
* Navigate unfamiliar codebases faster

Example questions users can ask:

* What does this repository do
* Explain the authentication flow
* Where is the database connection defined
* Which file handles API routing
* Explain the architecture of this project

The system retrieves relevant code snippets and uses them as context for the model before generating an answer.

---

# Core Idea

Large Language Models cannot read entire repositories due to context limits. RepoGPT solves this using **Retrieval Augmented Generation (RAG).**

Instead of feeding the entire repository to the model, RepoGPT:

1. Extracts files from a GitHub repository
2. Breaks them into smaller chunks
3. Converts chunks into embeddings
4. Stores embeddings in a vector database
5. Retrieves relevant chunks when a question is asked
6. Sends those chunks to the language model to generate an answer

This ensures responses are **grounded in the actual code.**

---

# System Architecture

High level architecture:

```
User
 ↓
Next.js Frontend
 ↓
FastAPI Backend (RAG Pipeline)
 ↓
GitHub API (Repository Files)
 ↓
Code Chunking
 ↓
Embedding Generation
 ↓
Qdrant Vector Database
 ↓
Similarity Search
 ↓
LLM (OpenAI / Gemini / Anthropic)
 ↓
Answer Returned to User
```

---

# RAG Pipeline

RepoGPT works in two main stages.

## Repository Indexing

When a user submits a repository:

```
GitHub Repository URL
        ↓
Fetch files using GitHub API
        ↓
Filter relevant code files
        ↓
Split files into chunks
        ↓
Generate embeddings
        ↓
Store embeddings in Qdrant
```

The repository is now indexed and searchable.

---

## Query and Retrieval

When a user asks a question:

```
User Question
      ↓
Convert question into embedding
      ↓
Search Qdrant for similar code chunks
      ↓
Retrieve top relevant chunks
      ↓
Send chunks + question to LLM
      ↓
Generate explanation
```

The model answers using the retrieved code context.

---

# Tech Stack

## Frontend

Next.js

Responsibilities:

* User interface
* Repository input
* Chat interface
* API key input
* Display answers and sources

---

## Backend

FastAPI (Python)

Responsibilities:

* RAG pipeline
* GitHub repository ingestion
* Code chunking
* Embedding generation
* Retrieval logic
* LLM request handling

Python is used because it has the strongest ecosystem for AI and retrieval systems.

---

## Vector Database

Qdrant Cloud

Responsibilities:

* Store embeddings
* Perform similarity search
* Retrieve relevant code chunks

Each stored vector includes metadata such as:

* repository name
* file path
* chunk id
* programming language

---

## Repository Ingestion

GitHub API

Responsibilities:

* Fetch repository file structure
* Retrieve file contents
* Filter useful code files

Using the GitHub API avoids cloning repositories and reduces server storage usage.

---

## LLM Providers

RepoGPT supports multiple providers.

Users paste their own API keys.

Supported providers:

* OpenAI
* Google Gemini
* Anthropic Claude

API keys are **not stored** and are only used during the session.

This allows users to control their own API usage.

---

# Security Model

RepoGPT does not store API keys.

Workflow:

1. User pastes their API key in the UI
2. The key is used only for that session
3. Requests are sent to the chosen model provider
4. The key is discarded when the session ends

This ensures:

* No billing risk for the platform
* Users control their own API usage

---

# Features

Core features include:

* Ask questions about any GitHub repository
* Code aware retrieval
* Semantic search over code
* Multi model support
* Source aware answers
* Developer friendly chat interface

Optional advanced features may include:

* Display retrieved code chunks
* Show file references in answers
* Similarity scores for retrieved context
* Repository architecture explanations

---

# Example Use Case

A developer finds a new repository but does not want to manually read hundreds of files.

They paste the repository link into RepoGPT and ask:

```
Explain the authentication flow in this project
```

RepoGPT retrieves the relevant code files and generates a structured explanation based on the actual implementation.

---

# Future Improvements

Possible future enhancements include:

* repository caching to avoid re indexing
* better code aware chunking
* hybrid search combining keyword and vector search
* code graph based retrieval
* repository architecture visualization
* multi repository querying

---

# Project Goal

RepoGPT aims to demonstrate how Retrieval Augmented Generation can be applied to **real developer workflows**.

The project showcases:

* RAG system design
* vector database usage
* code retrieval techniques
* multi model LLM integration
* scalable AI architecture

---

# License

MIT License
