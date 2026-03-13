from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings


SUPPORTED_MODELS = {
    "openai": ["gpt-4o", "gpt-4o-mini"],
    "anthropic": ["claude-sonnet-4-5", "claude-3-5-haiku-20241022"],
    "gemini": ["models/gemini-2.5-flash", "models/gemini-2.5-pro"],
}

# Explicit embedding model choices
EMBEDDING_MODELS = {
    "openai": "text-embedding-3-small",      # 1536 dimensions
    "anthropic": "text-embedding-3-small",   # 1536 dimensions
    "gemini": "models/gemini-embedding-001", # 3072 dimensions
}

EMBEDDING_DIMENSIONS = {
    "openai": 1536,       # text-embedding-3-small → 1536 dims
    "anthropic": 1536,    # Uses OpenAI text-embedding-3-small → 1536 dims
    "gemini": 3072,       # models/gemini-embedding-001 → 3072 dims
}


def get_embeddings(provider, embed_api_key):
    print(f"🔧 Getting embeddings for provider: {provider}")

    if provider == "openai":
        print(f"📦 Using OpenAI model: {EMBEDDING_MODELS['openai']} (1536 dims)")
        # Be explicit about model and dimensions
        embeddings = OpenAIEmbeddings(
            api_key=embed_api_key,
            model=EMBEDDING_MODELS["openai"],
            dimensions=1536  # Explicitly set dimensions for text-embedding-3-small
        )
        return embeddings, EMBEDDING_DIMENSIONS["openai"]

    elif provider == "anthropic":
        # Use OpenAI embeddings for Anthropic (Anthropic doesn't have embeddings API)
        print(f"📦 Using OpenAI model for Anthropic: {EMBEDDING_MODELS['anthropic']} (1536 dims)")
        embeddings = OpenAIEmbeddings(
            api_key=embed_api_key,
            model=EMBEDDING_MODELS["anthropic"],
            dimensions=1536  # Explicitly set dimensions for text-embedding-3-small
        )
        return embeddings, EMBEDDING_DIMENSIONS["anthropic"]

    elif provider == "gemini":
        # Use Gemini embedding model with same API key
        print(f"📦 Using Gemini model: {EMBEDDING_MODELS['gemini']} (3072 dims)")
        embeddings = GoogleGenerativeAIEmbeddings(
            google_api_key=embed_api_key,
            model=EMBEDDING_MODELS["gemini"]
        )
        return embeddings, EMBEDDING_DIMENSIONS["gemini"]

    else:
        raise ValueError(f"Unsupported provider '{provider}'. Choose from: openai, anthropic, gemini")


# Map outdated/stale Gemini model names to current supported ones
GEMINI_MODEL_ALIASES = {
    "gemini-1.5-flash": "models/gemini-2.5-flash",
    "gemini-1.5-pro": "models/gemini-2.5-pro",
    "gemini-2.0-flash": "models/gemini-2.0-flash",
    "models/gemini-1.5-flash": "models/gemini-2.5-flash",
    "models/gemini-1.5-pro": "models/gemini-2.5-pro",
    "gemini-2.0-flash-exp": "models/gemini-2.0-flash",
}


def get_llm(provider, model, api_key):

    if provider == "openai":
        return ChatOpenAI(api_key=api_key, model=model)

    elif provider == "anthropic":
        return ChatAnthropic(api_key=api_key, model=model)

    elif provider == "gemini":
        resolved_model = GEMINI_MODEL_ALIASES.get(model, model)
        if resolved_model != model:
            print(f"⚠️  Remapping stale Gemini model '{model}' → '{resolved_model}'")
        return ChatGoogleGenerativeAI(google_api_key=api_key, model=resolved_model)

    else:
        raise ValueError(f"Unsupported provider '{provider}'. Choose from: openai, anthropic, gemini")
