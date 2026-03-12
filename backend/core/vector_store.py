from pinecone import Pinecone as PineconeClient, ServerlessSpec
from langchain_core.documents import Document
import os
from dotenv import load_dotenv
import time
import uuid

from core.providers import get_embeddings

load_dotenv()


def _get_index(pc, index_name, dimensions):
    print(f"\n🔍 Checking Pinecone index: '{index_name}'")
    existing = [idx.name for idx in pc.list_indexes().indexes]
    
    if index_name in existing:
        # Check if existing index has correct dimensions
        index_info = pc.describe_index(index_name)
        existing_dims = index_info.dimension
        
        print(f"   📊 Index exists with {existing_dims} dimensions")
        print(f"   📊 Need {dimensions} dimensions")
        
        if existing_dims != dimensions:
            print(f"   ⚠️ DIMENSION MISMATCH! Deleting index for recreation...")
            pc.delete_index(index_name)
            # Wait for deletion
            time.sleep(2)
        else:
            print(f"   ✅ Dimensions match! Reusing existing index")
            return pc.Index(index_name)
    
    print(f"   ➕ Creating new Pinecone index with {dimensions} dimensions...")
    pc.create_index(
        name=index_name,
        dimension=dimensions,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
    # Poll until ready
    for attempt in range(20):
        try:
            info = pc.describe_index(index_name)
            if info.status.ready:
                print(f"   ✅ Index created and ready!")
                break
        except:
            pass
        if attempt < 19:
            time.sleep(3)
    
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

    print(f"\n🚀 Starting indexing for collection: {collection_name}")
    print(f"🔑 Provider: {provider}")

    embeddings_model, _ = get_embeddings(provider, embed_key)

    texts = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]

    # Detect actual dimensions by embedding the first chunk
    print(f"🧪 Detecting actual embedding dimensions...")
    test_vector = embeddings_model.embed_documents([texts[0]])
    actual_dims = len(test_vector[0])
    print(f"✅ Actual embedding dimensions: {actual_dims}")

    pc = PineconeClient(api_key=pc_key)
    index = _get_index(pc, collection_name, actual_dims)

    # Embed and upsert in batches of 100
    batch_size = 100
    total_vectors = 0

    # First batch already embedded above — reuse it
    first_batch_texts = texts[0:batch_size]
    first_batch_meta = metadatas[0:batch_size]
    first_batch_vectors = embeddings_model.embed_documents(first_batch_texts)
    records = [
        {
            "id": str(uuid.uuid4()),
            "values": vec,
            "metadata": {**meta, "text": txt}
        }
        for vec, meta, txt in zip(first_batch_vectors, first_batch_meta, first_batch_texts)
    ]
    index.upsert(vectors=records)
    total_vectors += len(records)
    print(f"📤 Upserted batch 1. Total: {total_vectors}")

    for i in range(batch_size, len(texts), batch_size):
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
        total_vectors += len(records)
        print(f"📤 Upserted batch {i//batch_size + 1}. Total: {total_vectors}")

    print(f"🎉 Successfully indexed {total_vectors} vectors")
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
