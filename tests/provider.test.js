import { test } from 'node:test';
import assert from 'node:assert/strict';
import { providerStatus, generateJSON, AIError } from '../ai/provider.js';

function withEnv(vars, fn) {
  const saved = {};
  for (const k of Object.keys(vars)) {
    saved[k] = process.env[k];
    if (vars[k] === undefined) delete process.env[k];
    else process.env[k] = vars[k];
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('unknown provider is not configured', () => {
  withEnv({ AI_PROVIDER: 'openai' }, () => {
    assert.equal(providerStatus().configured, false);
  });
});

test('placeholder key or model is not configured, and the key never appears in status', () => {
  withEnv({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'your-gemini-key-here', GEMINI_MODEL: 'm' }, () => {
    const s = providerStatus();
    assert.equal(s.configured, false);
    assert.match(s.problem, /GEMINI_API_KEY/);
  });
  withEnv({ AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'secret-value-123', ANTHROPIC_MODEL: undefined }, () => {
    const s = providerStatus();
    assert.equal(s.configured, false);
    assert.ok(!JSON.stringify(s).includes('secret-value-123'));
  });
});

test('fully set provider is configured', () => {
  withEnv({ AI_PROVIDER: 'Anthropic', ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'm' }, () => {
    assert.deepEqual(providerStatus(), { provider: 'anthropic', configured: true });
  });
});

test('generateJSON refuses with not_configured instead of calling out', async () => {
  await withEnv({ AI_PROVIDER: undefined }, async () => {
    await assert.rejects(generateJSON({ system: '', parts: [], schema: {} }), (e) => e instanceof AIError && e.code === 'not_configured');
  });
});
