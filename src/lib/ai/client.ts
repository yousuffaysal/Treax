import 'server-only';
import Groq from 'groq-sdk';
import { hasGroq } from '@/lib/env';

/**
 * The single place the LLM is reached from. Swapping providers means editing
 * this file only — every feature calls `complete()` or `streamText()`.
 *
 * The key is read server-side and never reaches the client bundle; the
 * `server-only` import above makes an accidental client import a build error.
 */

let client: Groq | null = null;

function groq(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new AiUnavailableError();
    client = new Groq({ apiKey });
  }
  return client;
}

export class AiUnavailableError extends Error {
  constructor() {
    super('The AI service is not configured.');
    this.name = 'AiUnavailableError';
  }
}

export const aiAvailable = hasGroq;

const MODEL = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export type CompleteOptions = {
  system: string;
  user: string;
  /** Low for classification, higher for generative copy. */
  temperature?: number;
  maxTokens?: number;
  /** Ask the model for a JSON object and parse it. */
  json?: boolean;
};

export async function complete({ system, user, temperature = 0.4, maxTokens = 900, json = false }: CompleteOptions): Promise<string> {
  const res = await groq().chat.completions.create({
    model: MODEL(),
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' as const } } : {}),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}

export async function completeJson<T>(options: Omit<CompleteOptions, 'json'>): Promise<T | null> {
  const raw = await complete({ ...options, json: true });
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Some models wrap JSON in prose or a fence even under response_format.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

/** Token stream for the AI Studio tools, which show progress as they write. */
export async function* streamText({ system, user, temperature = 0.6, maxTokens = 900 }: Omit<CompleteOptions, 'json'>) {
  const stream = await groq().chat.completions.create({
    model: MODEL(),
    temperature,
    max_tokens: maxTokens,
    stream: true,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
