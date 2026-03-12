from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import os
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
            collection_name=request.collection_name,
            embed_api_key=request.embed_api_key
        )
        
        print(f"Successfully indexed {len(chunks)} chunks")
        
        return AnalyzeResponse(
            status="success",
            message=f"Successfully analyzed {request.owner}/{request.repo}",
            owner=request.owner,
            repo=request.repo,
            collection_name=request.collection_name,
            chunks_indexed=len(chunks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing repository: {str(e)}"
        )


@app.post("/answer", response_model=AnswerResponse)
async def answer(request: AnswerRequest):
    try:
        # Get embeddings
        embed_key = request.embed_api_key or request.api_key
        embeddings, _ = get_embeddings(request.provider, embed_key)
        
        # Initialize Pinecone directly (no LangChain wrapper)
        from pinecone import Pinecone as PineconeClient
        pc = PineconeClient(api_key=os.getenv("PINECONE_API_KEY"))
        index = pc.Index(request.collection_name)
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