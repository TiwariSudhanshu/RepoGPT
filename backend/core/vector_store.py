from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, Filter, FieldCondition, MatchValue
from langchain_community.vectorstores import Qdrant

from core.providers import get_embeddings


def index_chunks(
    chunks,
    provider,
    api_key,
    qdrant_url,
    qdrant_api_key,
    collection_name="repo_vectors",
    embed_api_key=None
):

    embed_key = embed_api_key or api_key

    embeddings, dimensions = get_embeddings(provider, embed_key)

    client = QdrantClient(
        url=qdrant_url,
        api_key=qdrant_api_key
    )

    collections = [c.name for c in client.get_collections().collections]

    if collection_name not in collections:

        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=dimensions,
                distance=Distance.COSINE
            )
        )

    vector_store = Qdrant(
        client=client,
        collection_name=collection_name,
        embeddings=embeddings
    )

    texts = [c["text"] for c in chunks]
    metadata = [c["metadata"] for c in chunks]

    vector_store.add_texts(texts, metadatas=metadata)

    return vector_store


def search_code(vector_store, owner, repo, question):

    retriever = vector_store.as_retriever(
        search_kwargs={
            "k": 6,
            "filter": Filter(
                must=[
                    FieldCondition(
                        key="owner",
                        match=MatchValue(value=owner)
                    ),
                    FieldCondition(
                        key="repo",
                        match=MatchValue(value=repo)
                    )
                ]
            )
        }
    )

    docs = retriever.invoke(question)

    return docs
