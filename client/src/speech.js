// Wrappers around the Web Speech API: speaking (speechSynthesis) and listening (SpeechRecognition).
// Nothing heard or spoken is stored; transcripts live only in memory for the current command.

import { LANGS } from './i18n.js';

const synth = window.speechSynthesis || null;
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const support = {
  tts: !!synth,
  stt: !!Recognition,
};

// ---------- Speaking ----------

let voices = [];
function loadVoices() {
  if (synth) voices = synth.getVoices();
}
if (synth) {
  loadVoices();
  synth.addEventListener?.('voiceschanged', loadVoices);
}

/** Is there an installed voice for this language? Returns null if the browser does not list voices yet. */
export function hasVoiceFor(lang) {
  loadVoices();
  if (!voices.length) return null;
  const prefix = LANGS[lang].code.slice(0, 2);
  return voices.some((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
}

function pickVoice(code) {
  loadVoices();
  const exact = voices.find((v) => v.lang === code);
  if (exact) return exact;
  const prefix = code.slice(0, 2);
  return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix)) || null;
}

// Chrome cuts long utterances off after ~15 s, so speak sentence by sentence.
export function splitSentences(text) {
  return String(text)
    .split(/(?<=[.!?।])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

let speakToken = 0;
export let currentChunk = '';

/**
 * Speak text. Resolves when finished or when interrupted (resolves `false` if interrupted).
 * @param {string} text
 * @param {{lang: string, rate: number, volume: number, onChunk?: (s:string)=>void}} opts
 */
export function speak(text, { lang = 'en', rate = 1, volume = 1, onChunk } = {}) {
  if (!synth) return Promise.resolve(true);
  cancelSpeech();
  const token = ++speakToken;
  const code = LANGS[lang]?.code || 'en-IN';
  const voice = pickVoice(code);
  const parts = splitSentences(text);

  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (token !== speakToken) return resolve(false);
      if (i >= parts.length) {
        currentChunk = '';
        return resolve(true);
      }
      try {
        const u = new SpeechSynthesisUtterance(parts[i++]);
        u.lang = code;
        try { if (voice) u.voice = voice; } catch { /* fall back to lang only */ }
        u.rate = rate;
        u.volume = volume;
        currentChunk = u.text;
        onChunk?.(u.text);
        u.onend = next;
        u.onerror = () => (token === speakToken ? next() : resolve(false));
        synth.speak(u);
      } catch {
        // Never leave the app stuck in "speaking": text is still shown and announced.
        currentChunk = '';
        resolve(true);
      }
    };
    next();
  });
}

export function cancelSpeech() {
  speakToken++;
  currentChunk = '';
  if (synth) synth.cancel();
}

export function isSpeaking() {
  return !!synth && (synth.speaking || synth.pending);
}

// ---------- Listening ----------

/**
 * Listen once and resolve with the best transcript.
 * Rejects with an Error whose `code` is one of:
 *   'unsupported' | 'denied' | 'no-speech' | 'network' | 'aborted' | 'error'
 */
let active = null;
export function listenOnce(lang = 'en', { timeoutMs = 8000 } = {}) {
  if (!Recognition) return Promise.reject(Object.assign(new Error('unsupported'), { code: 'unsupported' }));
  stopListening();
  return new Promise((resolve, reject) => {
    const rec = new Recognition();
    active = rec;
    rec.lang = LANGS[lang]?.code || 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    let settled = false;
    const finish = (fn, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (active === rec) active = null;
      fn(val);
    };
    const timer = setTimeout(() => {
      try { rec.abort(); } catch {}
      finish(reject, Object.assign(new Error('no-speech'), { code: 'no-speech' }));
    }, timeoutMs);

    rec.onresult = (e) => {
      const alts = Array.from(e.results[0] || []).map((a) => a.transcript);
      finish(resolve, alts);
    };
    rec.onerror = (e) => {
      const map = { 'not-allowed': 'denied', 'service-not-allowed': 'denied', 'no-speech': 'no-speech', network: 'network', aborted: 'aborted' };
      const code = map[e.error] || 'error';
      finish(reject, Object.assign(new Error(code), { code }));
    };
    rec.onend = () => finish(reject, Object.assign(new Error('no-speech'), { code: 'no-speech' }));
    try {
      rec.start();
    } catch (err) {
      finish(reject, Object.assign(new Error('error'), { code: 'error' }));
    }
  });
}

export function stopListening() {
  if (active) {
    try { active.abort(); } catch {}
    active = null;
  }
}

/**
 * Barge-in: listen continuously while the app speaks, and call onStop() if the user says a stop word.
 * Ignores matches that are just the app hearing its own voice (the word is in the sentence being spoken).
 * Returns a function that ends barge-in listening.
 */
export function startBargeIn(lang, isStopWord, onStop) {
  if (!Recognition) return () => {};
  const rec = new Recognition();
  rec.lang = LANGS[lang]?.code || 'en-IN';
  rec.continuous = true;
  rec.interimResults = true;
  let ended = false;
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const said = e.results[i][0].transcript;
      if (isStopWord(said) && !isStopWord(currentChunk)) {
        ended = true;
        try { rec.abort(); } catch {}
        onStop();
        return;
      }
    }
  };
  rec.onerror = () => {};
  rec.onend = () => {
    if (!ended) {
      try { rec.start(); } catch {}
    }
  };
  try { rec.start(); } catch {}
  return () => {
    ended = true;
    try { rec.abort(); } catch {}
  };
}
