export type AiProvider = "deepseek" | "openai";

export type AiConfig = {
  provider: AiProvider;
  providerLabel: string;
  apiKey: string;
  model: string;
  endpoint: string;
};

export function getAiConfig(): AiConfig | null {
  if (process.env.AI_FEATURE_ENABLED?.toLowerCase() === "false") return null;
  const provider = (process.env.AI_PROVIDER || "deepseek").toLowerCase();
  if (provider === "deepseek" && process.env.DEEPSEEK_API_KEY) {
    return {
      provider,
      providerLabel: "DeepSeek",
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      endpoint: "https://api.deepseek.com/chat/completions",
    };
  }
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return {
      provider,
      providerLabel: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      endpoint: "https://api.openai.com/v1/chat/completions",
    };
  }
  return null;
}

export function getRepositoryUrl() {
  const value = process.env.REPOSITORY_URL?.trim();
  return value?.startsWith("https://github.com/") ? value : null;
}
