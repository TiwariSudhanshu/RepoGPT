from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import os
import re
from dotenv import load_dotenv

from core.qa import answer_question
from core.vector_store import search_code, index_chunks
from core.providers import get_embeddings
from core.github import load_repo
from core.chunker import chunk_documents

load_dotenv()

app = FastAPI(
    title="RepoGPT API",
    description="RAG API for GitHub repository analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)


def sanitize_collection_name(name: str) -> str:
    """
    Sanitize collection name for Pinecone.
    Must consist of lowercase alphanumeric characters and hyphens only.
    """
    # Convert to lowercase
    name = name.lower()
    # Replace invalid characters with hyphens
    name = re.sub(r"[^a-z0-9-]", "-", name)
    # Remove consecutive hyphens
    name = re.sub(r"-+", "-", name)
    # Remove leading/trailing hyphens
    name = name.strip("-")
    return name


class AnswerRequest(BaseModel):
    owner: str
    repo: str
    question: str
    provider: str
    model: str
    api_key: str
    embed_api_key: Optional[str] = None
    collection_name: str = "repo-gpt"

class AnswerResponse(BaseModel):
    answer: str
    question: str
    provider: str
    model: str


class AnalyzeRequest(BaseModel):
    owner: str
    repo: str
    provider: str
    api_key: str
    embed_api_key: Optional[str] = None
    collection_name: str = "repo-gpt"
    github_token: Optional[str] = None


class AnalyzeResponse(BaseModel):
    status: str
    message: str
    owner: str
    repo: str
    collection_name: str
    chunks_indexed: int

@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze a GitHub repository by loading its code, chunking it, 
    and indexing it into Pinecone vector store for RAG.
    """
    try:
        # Sanitize collection name for Pinecone
        sanitized_collection_name = sanitize_collection_name(request.collection_name)
        print(f"\n{'='*60}")
        print(f"📋 ANALYZE REQUEST")
        print(f"{'='*60}")
        print(f"Repository: {request.owner}/{request.repo}")
        print(f"Provider: {request.provider}")
        print(f"Collection: {request.collection_name} → {sanitized_collection_name}")
        print(f"{'='*60}\n")
        
        print(f"Starting analysis of {request.owner}/{request.repo}")
        
        # Step 1: Load repository from GitHub
        print("Loading repository from GitHub...")
        documents = load_repo(
            request.owner,
            request.repo,
            github_token=request.github_token
        )
        
        if not documents:
            raise HTTPException(
                status_code=404,
                detail=f"No files found in {request.owner}/{request.repo}"
            )
        
        print(f"Loaded {len(documents)} files from repository")
        
        # Step 2: Chunk documents
        print("Chunking documents...")
        chunks = chunk_documents(documents)
        print(f"Created {len(chunks)} chunks")
        
        # Step 3: Index chunks into Pinecone
        print("Indexing chunks into Pinecone...")
        vector_store = index_chunks(
            chunks=chunks,
            provider=request.provider,
            api_key=request.api_key,
            pinecone_api_key=os.getenv("PINECONE_API_KEY"),
            collection_name=sanitized_collection_name,
            embed_api_key=request.embed_api_key
        )
        
        print(f"Successfully indexed {len(chunks)} chunks")
        print(f"{'='*60}")
        
        return AnalyzeResponse(
            status="success",
            message=f"Successfully analyzed {request.owner}/{request.repo}",
            owner=request.owner,
            repo=request.repo,
            collection_name=sanitized_collection_name,
            chunks_indexed=len(chunks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"{'='*60}")
        print(f"❌ ERROR during analysis: {str(e)}")
        print(f"{'='*60}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing repository: {str(e)}"
        )


@app.post("/answer", response_model=AnswerResponse)
async def answer(request: AnswerRequest):
    try:
        # Sanitize collection name for Pinecone
        sanitized_collection_name = sanitize_collection_name(request.collection_name)
        
        # Get embeddings
        embed_key = request.embed_api_key or request.api_key
        embeddings, _ = get_embeddings(request.provider, embed_key)
        
        # Initialize Pinecone directly (no LangChain wrapper)
        from pinecone import Pinecone as PineconeClient
        pc = PineconeClient(api_key=os.getenv("PINECONE_API_KEY"))
        index = pc.Index(sanitized_collection_name)
        vector_store = {"index": index, "embeddings_model": embeddings}
        
        # Search for relevant code
        docs = search_code(vector_store, request.owner, request.repo, request.question)
        
        if not docs:
            raise HTTPException(
                status_code=404,
                detail=f"No relevant code found for question in {request.owner}/{request.repo}"
            )

        # Generate answer
        result = answer_question(
            docs=docs,
            question=request.question,
            provider=request.provider,
            model=request.model,
            api_key=request.api_key
        )
    
        return AnswerResponse(
            answer=result,
            question=request.question,
            provider=request.provider,
            model=request.model
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)