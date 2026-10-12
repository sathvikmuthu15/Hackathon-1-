// Provider abstraction: Gemini or Claude, chosen by AI_PROVIDER.
// Model names come only from env vars. Keys are read here and never returned or logged.
// The actual vision calls are implemented in Module 2.

const PROVIDERS = {
  gemini: { keyVar: 'GEMINI_API_KEY', modelVar: 'GEMINI_MODEL' },
  anthropic: { keyVar: 'ANTHROPIC_API_KEY', modelVar: 'ANTHROPIC_MODEL' },
};

function current() {
  const name = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  return { name, cfg: PROVIDERS[name] };
}

// Safe to expose: says whether things are set, never what they are.
export function providerStatus() {
  const { name, cfg } = current();
  if (!cfg) return { provider: name || 'none', configured: false, problem: 'AI_PROVIDER must be "gemini" or "anthropic"' };
  const key = process.env[cfg.keyVar];
  const model = process.env[cfg.modelVar];
  if (!key || key.startsWith('your-')) return { provider: name, configured: false, problem: `${cfg.keyVar} not set` };
  if (!model || model.startsWith('your-')) return { provider: name, configured: false, problem: `${cfg.modelVar} not set` };
  return { provider: name, configured: true };
}
