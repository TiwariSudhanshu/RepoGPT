from pinecone import Pinecone as PineconeClient, ServerlessSpec
from langchain_core.documents import Document
import os
from dotenv import load_dotenv
import time
import uuid

from core.providers import get_embeddings

load_dotenv()


def _get_index(pc, index_name, dimensions):
    existing = [idx.name for idx in pc.list_indexes().indexes]
    if index_name not in existing:
        print(f"Creating Pinecone index '{index_name}'...")
        pc.create_index(
            name=index_name,
            dimension=dimensions,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        # Poll until ready
        for _ in range(20):
            info = pc.describe_index(index_name)
            if info.status.ready:
                break
            time.sleep(3)
        print(f"Index '{index_name}' created successfully")
    return pc.Index(index_name)


def index_chunks(
    chunks,
    provider,
    api_key,
    pinecone_api_key=None,
    collection_name="repo-gpt",
    embed_api_key=None
):
    embed_key = embed_api_key or api_key
    pc_key = pinecone_api_key or os.getenv("PINECONE_API_KEY")

    embeddings_model, dimensions = get_embeddings(provider, embed_key)
    pc = PineconeClient(api_key=pc_key)
    index = _get_index(pc, collection_name, dimensions)

    texts = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]

    # Embed in batches of 100
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        batch_meta = metadatas[i:i + batch_size]
        vectors = embeddings_model.embed_documents(batch_texts)
        records = [
            {
                "id": str(uuid.uuid4()),
                "values": vec,
                "metadata": {**meta, "text": txt}
            }
            for vec, meta, txt in zip(vectors, batch_meta, batch_texts)
        ]
        index.upsert(vectors=records)

    # Return a simple wrapper so search_code can use it
    return {"index": index, "embeddings_model": embeddings_model}


def search_code(vector_store, owner, repo, question):
    index = vector_store["index"]
    embeddings_model = vector_store["embeddings_model"]

    query_vector = embeddings_model.embed_query(question)
    results = index.query(
        vector=query_vector,
        top_k=6,
        filter={"owner": {"$eq": owner}, "repo": {"$eq": repo}},
        include_metadata=True
    )

    docs = [
        Document(
            page_content=match.metadata.get("text", ""),
            metadata={k: v for k, v in match.metadata.items() if k != "text"}
        )
        for match in results.matches
    ]
    return docs
