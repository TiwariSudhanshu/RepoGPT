from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_voyageai import VoyageAIEmbeddings


SUPPORTED_MODELS = {
    "openai": ["gpt-4o", "gpt-4o-mini"],
    "anthropic": ["claude-sonnet-4-5", "claude-3-5-haiku-20241022"],
    "gemini": ["gemini-2.0-flash", "gemini-1.5-pro"],
}

EMBEDDING_DIMENSIONS = {
    "openai": 1536,
    "anthropic": 1024,
    "gemini": 768,
}


def get_embeddings(provider, embed_api_key):

    if provider == "openai":
        return OpenAIEmbeddings(
            api_key=embed_api_key,
            model="text-embedding-3-small"
        ), EMBEDDING_DIMENSIONS["openai"]

    elif provider == "anthropic":
        return VoyageAIEmbeddings(
            voyage_api_key=embed_api_key,
            model="voyage-3"
        ), EMBEDDING_DIMENSIONS["anthropic"]

    elif provider == "gemini":
        return GoogleGenerativeAIEmbeddings(
            google_api_key=embed_api_key,
            model="models/embedding-001"
        ), EMBEDDING_DIMENSIONS["gemini"]

    else:
        raise ValueError(f"Unsupported provider '{provider}'. Choose from: openai, anthropic, gemini")


def get_llm(provider, model, api_key):

    if provider == "openai":
        return ChatOpenAI(api_key=api_key, model=model)

    elif provider == "anthropic":
        return ChatAnthropic(api_key=api_key, model=model)

    elif provider == "gemini":
        return ChatGoogleGenerativeAI(google_api_key=api_key, model=model)

    else:
        raise ValueError(f"Unsupported provider '{provider}'. Choose from: openai, anthropic, gemini")
