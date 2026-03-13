/**
 * Local storage utility for API keys
 * Keys are stored in browser localStorage with provider prefix
 */

const API_KEY_PREFIX = "repo-gpt-api-key";
const LAST_PROVIDER_KEY = "repo-gpt-last-provider";

export interface StoredApiKey {
  provider: string;
  model: string;
  apiKey: string;
  timestamp: number;
}

/**
 * Save API key to localStorage
 */
export function saveApiKey(
  provider: string,
  model: string,
  apiKey: string,
): void {
  // Only save on client
  if (typeof window === "undefined") {
    console.error("localStorage not available - not in browser");
    return;
  }

  try {
    const data: StoredApiKey = {
      provider,
      model,
      apiKey,
      timestamp: Date.now(),
    };
    const key = `${API_KEY_PREFIX}-${provider}`;
    const value = JSON.stringify(data);
    localStorage.setItem(key, value);
    // Also save which provider was last used
    localStorage.setItem(LAST_PROVIDER_KEY, provider);
    console.log(`✅ API key saved for provider: ${provider}`);
    console.log(`Storage key: ${key}`);
    console.log(`Saved data:`, data);
  } catch (error) {
    console.error("Failed to save API key to localStorage:", error);
  }
}

/**
 * Get stored API key from localStorage
 * Tries to get the last used provider's API key
 */
export function getApiKey(provider?: string): StoredApiKey | null {
  // Only access localStorage on client
  if (typeof window === "undefined") {
    console.warn("localStorage not available - not in browser");
    return null;
  }

  try {
    // If provider not specified, try to get the last used provider
    let providerToUse = provider;

    if (!providerToUse) {
      const lastProvider = localStorage.getItem(LAST_PROVIDER_KEY);
      console.log(
        `No provider specified, checking last used provider: ${lastProvider}`,
      );
      if (!lastProvider) {
        console.warn(
          "❌ No provider specified and no last used provider found",
        );
        // Try 'openai' as fallback
        providerToUse = "openai";
      } else {
        providerToUse = lastProvider;
      }
    }

    const key = `${API_KEY_PREFIX}-${providerToUse}`;
    const stored = localStorage.getItem(key);

    console.log(`🔍 Looking for API key with key: "${key}"`);
    console.log(
      `📦 All localStorage keys:`,
      Object.keys(localStorage).filter((k) => k.includes("repo-gpt")),
    );

    if (!stored) {
      console.warn(`❌ No API key found for provider: ${providerToUse}`);
      return null;
    }

    const data = JSON.parse(stored) as StoredApiKey;

    // Remap stale Gemini model names saved in localStorage
    const GEMINI_MODEL_ALIASES: Record<string, string> = {
      "gemini-1.5-flash": "models/gemini-2.5-flash",
      "gemini-1.5-pro": "models/gemini-2.5-pro",
      "models/gemini-1.5-flash": "models/gemini-2.5-flash",
      "models/gemini-1.5-pro": "models/gemini-2.5-pro",
      "gemini-2.0-flash-exp": "models/gemini-2.0-flash",
    };
    if (data.provider === "gemini" && GEMINI_MODEL_ALIASES[data.model]) {
      console.warn(
        `⚠️ Remapping stale model '${data.model}' → '${GEMINI_MODEL_ALIASES[data.model]}'`,
      );
      data.model = GEMINI_MODEL_ALIASES[data.model];
    }

    console.log(
      `✅ Successfully retrieved API key for provider: ${providerToUse}`,
      { model: data.model },
    );
    return data;
  } catch (error) {
    console.error(`Failed to retrieve API key:`, error);
    return null;
  }
}

/**
 * Get all saved API key providers
 */
export function getAllSavedProviders(): string[] {
  if (typeof window === "undefined") return [];

  const providers: string[] = [];
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(API_KEY_PREFIX) && key !== LAST_PROVIDER_KEY) {
      const provider = key.replace(API_KEY_PREFIX + "-", "");
      providers.push(provider);
    }
  });
  return providers;
}

/**
 * Get last used provider
 */
export function getLastUsedProvider(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_PROVIDER_KEY);
}

/**
 * Clear all stored API keys
 */
export function clearAllApiKeys(): void {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(API_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  localStorage.removeItem(LAST_PROVIDER_KEY);
  console.log("✅ All API keys cleared from localStorage");
}
