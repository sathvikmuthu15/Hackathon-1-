// Provider abstraction: Gemini or Claude, chosen by AI_PROVIDER.
// Model names come only from env vars. Keys are read here and never returned or logged.
// Errors carry a short `code` only, never the provider's raw message (it can echo request content).
//
// Gemini: REST generateContent (https://ai.google.dev/api/generate-content), JSON via
//         generationConfig.responseMimeType + responseSchema, key in the x-goog-api-key header.
// Claude: official @anthropic-ai/sdk, JSON via output_config.format { type: 'json_schema' }.

import Anthropic from '@anthropic-ai/sdk';

const PROVIDERS = {
  gemini: { keyVar: 'GEMINI_API_KEY', modelVar: 'GEMINI_MODEL' },
  anthropic: { keyVar: 'ANTHROPIC_API_KEY', modelVar: 'ANTHROPIC_MODEL' },
};

const TIMEOUT_MS = 45_000;

function current() {
  const name = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  return { name, cfg: PROVIDERS[name] };
}

const isPlaceholder = (v) => !v || v.startsWith('your-');

// Safe to expose: says whether things are set, never what they are.
export function providerStatus() {
  const { name, cfg } = current();
  if (!cfg) return { provider: name || 'none', configured: false, problem: 'AI_PROVIDER must be "gemini" or "anthropic"' };
  if (isPlaceholder(process.env[cfg.keyVar])) return { provider: name, configured: false, problem: `${cfg.keyVar} not set` };
  if (isPlaceholder(process.env[cfg.modelVar])) return { provider: name, configured: false, problem: `${cfg.modelVar} not set` };
  return { provider: name, configured: true };
}

export class AIError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // not_configured | auth | rate_limited | timeout | refused | bad_output | provider_error
  }
}

/**
 * Ask the configured model for JSON matching `schema`.
 * @param {{ system: string, parts: Array<{text: string} | {image: {data: string, mimeType: string}}>, schema: object, maxTokens?: number }} req
 *   `schema` is plain JSON Schema (type/properties/required/items/enum/description).
 * @returns {Promise<object>} parsed JSON
 */
export async function generateJSON(req) {
  const status = providerStatus();
  if (!status.configured) throw new AIError('not_configured');
  const fn = status.provider === 'gemini' ? geminiJSON : anthropicJSON;
  const text = await fn(req);
  try {
    return JSON.parse(text);
  } catch {
    throw new AIError('bad_output');
  }
}

// ---------- Gemini ----------

// Gemini's responseSchema is an OpenAPI subset: no additionalProperties.
function toGeminiSchema(s) {
  if (Array.isArray(s)) return s.map(toGeminiSchema);
  if (!s || typeof s !== 'object') return s;
  const out = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === 'additionalProperties') continue;
    out[k] = k === 'properties' ? Object.fromEntries(Object.entries(v).map(([p, ps]) => [p, toGeminiSchema(ps)])) : toGeminiSchema(v);
  }
  return out;
}

async function geminiJSON({ system, parts, schema, maxTokens = 4096 }) {
  const model = encodeURIComponent(process.env.GEMINI_MODEL.trim());
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [
      {
        role: 'user',
        parts: parts.map((p) => (p.image ? { inline_data: { mime_type: p.image.mimeType, data: p.image.data } } : { text: p.text })),
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: toGeminiSchema(schema),
      maxOutputTokens: maxTokens,
    },
  };
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new AIError(err?.name === 'TimeoutError' ? 'timeout' : 'provider_error');
  }
  if (res.status === 401 || res.status === 403) throw new AIError('auth');
  if (res.status === 429) throw new AIError('rate_limited');
  if (!res.ok) throw new AIError('provider_error');
  const data = await res.json().catch(() => null);
  const cand = data?.candidates?.[0];
  if (!cand) throw new AIError(data?.promptFeedback?.blockReason ? 'refused' : 'bad_output');
  if (cand.finishReason === 'SAFETY' || cand.finishReason === 'PROHIBITED_CONTENT') throw new AIError('refused');
  const text = (cand.content?.parts || []).map((p) => p.text || '').join('');
  if (!text) throw new AIError('bad_output');
  return text;
}

// ---------- Claude ----------

let anthropicClient = null;
function claude() {
  // Explicit key so a stray ANTHROPIC_AUTH_TOKEN or CLI profile on the machine is never used instead.
  anthropicClient ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim(), timeout: TIMEOUT_MS, maxRetries: 1 });
  return anthropicClient;
}

// Structured outputs need additionalProperties:false on every object.
function toClaudeSchema(s) {
  if (Array.isArray(s)) return s.map(toClaudeSchema);
  if (!s || typeof s !== 'object') return s;
  const out = {};
  for (const [k, v] of Object.entries(s)) {
    out[k] = k === 'properties' ? Object.fromEntries(Object.entries(v).map(([p, ps]) => [p, toClaudeSchema(ps)])) : toClaudeSchema(v);
  }
  if (out.type === 'object' && !('additionalProperties' in out)) out.additionalProperties = false;
  return out;
}

async function anthropicJSON({ system, parts, schema, maxTokens = 4096 }) {
  let response;
  try {
    response = await claude().messages.create({
      model: process.env.ANTHROPIC_MODEL.trim(),
      max_tokens: maxTokens,
      system,
      messages: [
        {
          role: 'user',
          content: parts.map((p) =>
            p.image
              ? { type: 'image', source: { type: 'base64', media_type: p.image.mimeType, data: p.image.data } }
              : { type: 'text', text: p.text }
          ),
        },
      ],
      output_config: { format: { type: 'json_schema', schema: toClaudeSchema(schema) } },
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) throw new AIError('auth');
    if (err instanceof Anthropic.RateLimitError) throw new AIError('rate_limited');
    if (err instanceof Anthropic.APIConnectionTimeoutError) throw new AIError('timeout');
    throw new AIError('provider_error');
  }
  if (response.stop_reason === 'refusal') throw new AIError('refused');
  if (response.stop_reason === 'max_tokens') throw new AIError('bad_output');
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  if (!text) throw new AIError('bad_output');
  return text;
}
