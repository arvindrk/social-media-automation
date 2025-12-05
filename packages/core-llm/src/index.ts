/**
 * @core-llm - LLM client abstraction layer
 * TODO: Implement LLM provider integrations (OpenAI, Anthropic, etc.)
 */

/** Placeholder interface for LLM client */
export interface LLMClient {
  // TODO: Add methods as needed
  // - chat(messages: Message[]): Promise<Response>
  // - complete(prompt: string): Promise<string>
  // - embed(text: string): Promise<number[]>
}

/** Placeholder - throws until real LLM client is implemented */
export function createLLMClient(): LLMClient {
  throw new Error('LLM client not implemented');
}

// TODO: Implement LLM integrations
// - OpenAI client
// - Anthropic client
// - Rate limiting
// - Token counting
// - Streaming support

