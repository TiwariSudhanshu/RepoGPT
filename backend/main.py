from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from qdrant_client import QdrantClient
from langchain_community.vectorstores import Qdrant
from core.qa import answer_question
from core.vector_store import search_code
from core.providers import get_embeddings


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
    qdrant_url: str
    qdrant_api_key: str
    embed_api_key: Optional[str] = None
    collection_name: str = "repo_vectors"

class AnswerResponse(BaseModel):
    answer: str
    question: str
    provider: str
    model: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/answer", response_model=AnswerResponse)
async def answer(request: AnswerRequest):
    try:
        # Validate Qdrant connection
        client = QdrantClient(
            url=request.qdrant_url,
            api_key=request.qdrant_api_key
        )
        
        # Check if collection exists
        collections = [c.name for c in client.get_collections().collections]
        if request.collection_name not in collections:
            raise HTTPException(
                status_code=404,
                detail=f"Collection '{request.collection_name}' not found. Available collections: {collections}"
            )
        
        # Get embeddings
        embed_key = request.embed_api_key or request.api_key
        embeddings, _ = get_embeddings(request.provider, embed_key)
        
        # Create vector store
        vector_store = Qdrant(
            client=client,
            collection_name=request.collection_name,
            embeddings=embeddings
        )
        
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
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)