// Cantina Cuhh: voice home and navigation (Module 1).
import { t, LANGS } from './i18n.js';
import { matchCommand, normalize, COMMANDS } from './commands.js';
import { cue, unlockAudio, setCueVolume, startHeartbeat, stopHeartbeat } from './cues.js';
import { speak, cancelSpeech, listenOnce, stopListening, startBargeIn, hasVoiceFor, support } from './speech.js';
import { loadSettings, saveSettings, clearAllStorage, DEFAULT_SETTINGS } from './store.js';
import { renderDevPanel } from './devpanel.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// ---------- State (memory only) ----------
let settings = loadSettings();
const app = {
  started: false,
  status: 'idle', // idle | listening | thinking | speaking
  screen: 'home',
  pending: null, // null | 'consent' | 'confirmClear' | 'chooseLanguage'
  lastSpoken: '',
  misses: 0,
  stopBargeIn: null,
  offlineAnnounced: false,
};

// ---------- Helpers ----------
const RATE_MIN = 0.5, RATE_MAX = 2, VOL_MIN = 0.2, VOL_MAX = 1;
const round1 = (n) => Math.round(n * 10) / 10;

function spokenLang() {
  // If the device has no voice for the chosen language, speak English (and say so once).
  return hasVoiceFor(settings.lang) === false ? 'en' : settings.lang;
}

function persist() {
  saveSettings(settings);
}

function setStatus(status) {
  app.status = status;
  const key = { idle: 'stateIdle', listening: 'stateListening', thinking: 'stateThinking', speaking: 'stateSpeaking' }[status];
  $('#state-text').textContent = t(settings.lang, key);
  document.body.dataset.status = status;
  const label = status === 'speaking' || status === 'listening' ? 'lblStop' : 'lblTalk';
  $('#talk-label').textContent = t(settings.lang, label);
}

let liveTimer = null;
function announce(text, assertive = false) {
  const el = assertive ? $('#live-assertive') : $('#live-polite');
  el.textContent = '';
  clearTimeout(liveTimer);
  // Clearing first makes screen readers re-announce identical text (e.g. "repeat").
  liveTimer = setTimeout(() => (el.textContent = text), 60);
}

/**
 * Say something: show it, announce it to screen readers, and speak it (unless screen-reader mode).
 * `msg` is an i18n key or { text } for dynamic text.
 */
async function say(msg, { listenAfter = false, assertive = false, remember = true } = {}) {
  const fill = (str) => str.replace('{lang}', LANGS[settings.lang].name);
  const shown = fill(typeof msg === 'string' ? t(settings.lang, msg) : msg.text);
  const spoken = fill(typeof msg === 'string' ? t(spokenLang(), msg) : msg.text);
  if (remember) app.lastSpoken = msg;
  $('#caption').textContent = shown;
  announce(shown, assertive);

  stopListening();
  if (settings.screenReader) {
    setStatus('idle');
    return;
  }

  setStatus('speaking');
  if (settings.bargeIn && support.stt && settings.micConsent === true) {
    app.stopBargeIn = startBargeIn(settings.lang, isStopWord, () => {
      cancelSpeech();
      onStop();
    });
  }
  const finished = await speak(spoken, { lang: spokenLang(), rate: settings.rate, volume: settings.volume });
  app.stopBargeIn?.();
  app.stopBargeIn = null;
  if (!finished) return; // interrupted: whoever interrupted decides what happens next
  setStatus('idle');
  if (listenAfter && settings.autoListen) listen({ auto: true });
}

function isStopWord(text) {
  const m = matchCommand(text, settings.lang, ['stop']);
  return !!m && m.score >= 0.9;
}

// ---------- Listening ----------
async function listen({ auto = false } = {}) {
  if (!support.stt || settings.micConsent !== true) return;
  if (!navigator.onLine) {
    say('offline', { assertive: true });
    return;
  }
  cancelSpeech();
  setStatus('listening');
  cue.listening();
  startHeartbeat('listening', 2000);
  try {
    const alts = await listenOnce(settings.lang, { timeoutMs: 8000 });
    stopHeartbeat();
    handleUtterance(alts);
  } catch (err) {
    stopHeartbeat();
    setStatus('idle');
    switch (err.code) {
      case 'aborted':
        return; // user tapped to cancel, or we started speaking
      case 'no-speech':
        // After an automatic listen, just a soft cue: repeating "I did not hear anything" after every reply is tiring.
        if (auto) return cue.thinking();
        return say('noSpeechHeard');
      case 'denied':
        settings.micConsent = false;
        persist();
        cue.error();
        return say('micDenied', { assertive: true });
      case 'network':
        cue.error();
        return say('needsInternet', { assertive: true });
      default:
        cue.error();
        return say('errorGeneric', { assertive: true });
    }
  }
}

// ---------- Commands ----------
function allowedForPending() {
  if (app.pending === 'confirmClear') return ['yes', 'no', 'stop'];
  if (app.pending === 'chooseLanguage') return ['language', 'no', 'stop', 'home'];
  return null;
}

function handleUtterance(alternatives) {
  const alts = (Array.isArray(alternatives) ? alternatives : [alternatives]).filter(Boolean);
  setStatus('thinking');
  cue.thinking();
  $('#heard').textContent = alts[0] ? `${t(settings.lang, 'heard')}: “${alts[0]}”` : '';

  let match = null;
  for (const a of alts) {
    match = matchCommand(a, settings.lang, allowedForPending());
    if (match) break;
  }
  if (!match) {
    app.misses++;
    cue.error();
    // Don't loop forever: after two misses in a row, stop auto-listening until the user taps.
    return say('notUnderstood', { listenAfter: app.misses < 2 });
  }
  app.misses = 0;
  run(match.id, match);
}

function run(id, match = {}) {
  // Pending prompts get first say.
  if (app.pending === 'confirmClear') {
    hidePrompts();
    app.pending = null;
    if (id === 'yes') return clearEverything();
    cue.done();
    return say('cancelled', { listenAfter: true });
  }
  if (app.pending === 'chooseLanguage') {
    hidePrompts();
    app.pending = null;
    if (id === 'language' && match.language) return setLanguage(match.language);
    cue.done();
    return say('cancelled', { listenAfter: true });
  }

  switch (id) {
    case 'read':
      return openFeature('reader', 'readerSoon');
    case 'form':
      return openFeature('form', 'formSoon');
    case 'places':
      return openFeature('places', 'placesSoon');
    case 'repeat':
      if (!app.lastSpoken) return say('nothingToRepeat', { remember: false });
      cue.done();
      return say(app.lastSpoken, { remember: false });
    case 'stop':
      return onStop();
    case 'slower':
      return changeRate(-0.15);
    case 'faster':
      return changeRate(+0.15);
    case 'louder':
      return changeVolume(+0.2);
    case 'quieter':
      return changeVolume(-0.2);
    case 'help':
      cue.done();
      return say('helpList', { listenAfter: true });
    case 'language':
      if (match.language) return setLanguage(match.language);
      app.pending = 'chooseLanguage';
      showPrompt('#prompt-language');
      cue.done();
      return say('chooseLanguage', { listenAfter: true });
    case 'home':
      go('home');
      cue.done();
      return say('home', { listenAfter: true });
    case 'settings':
      go('settings');
      cue.done();
      return say('settingsOpened');
    case 'clear':
      app.pending = 'confirmClear';
      $('#confirm-text').textContent = t(settings.lang, 'confirmClear');
      showPrompt('#prompt-confirm');
      cue.done();
      return say('confirmClear', { listenAfter: true });
    case 'yes':
    case 'no':
    default:
      cue.error();
      return say('notUnderstood', { listenAfter: true });
  }
}

function onStop() {
  cancelSpeech();
  stopListening();
  stopHeartbeat();
  app.stopBargeIn?.();
  app.stopBargeIn = null;
  cue.done();
  setStatus('idle');
  // Short confirmation, not remembered, so "repeat" still repeats the real message.
  say('stopped', { remember: false });
}

function openFeature(screen, key) {
  go(screen);
  if (!navigator.onLine) {
    cue.error();
    return say('needsInternet', { assertive: true, listenAfter: false });
  }
  cue.done();
  return say(key, { listenAfter: true });
}

function changeRate(delta) {
  const next = round1(Math.min(RATE_MAX, Math.max(RATE_MIN, settings.rate + delta)));
  if (next === settings.rate) {
    cue.error();
    return say(delta < 0 ? 'slowest' : 'fastest', { remember: false });
  }
  settings.rate = next;
  persist();
  syncSettingsForm();
  cue.done();
  return say(delta < 0 ? 'slower' : 'faster', { remember: false, listenAfter: true });
}

function changeVolume(delta) {
  const next = round1(Math.min(VOL_MAX, Math.max(VOL_MIN, settings.volume + delta)));
  if (next === settings.volume) {
    cue.error();
    return say(delta < 0 ? 'quietest' : 'loudest', { remember: false });
  }
  settings.volume = next;
  setCueVolume(next);
  persist();
  syncSettingsForm();
  cue.done();
  return say(delta < 0 ? 'quieter' : 'louder', { remember: false, listenAfter: true });
}

async function setLanguage(code) {
  settings.lang = code;
  persist();
  applyLanguage();
  cue.done();
  if (hasVoiceFor(code) === false) await say('noVoice', { remember: false });
  return say('languageSet', { listenAfter: true });
}

async function clearEverything() {
  const keepLang = settings.lang;
  cancelSpeech();
  await clearAllStorage();
  // Reset in-memory state. Language and mic consent are kept for the rest of THIS session only (not saved),
  // so the confirmation is understandable and the user is not re-prompted mid-task.
  const micConsent = settings.micConsent;
  settings = { ...DEFAULT_SETTINGS, lang: keepLang, micConsent };
  app.lastSpoken = '';
  app.misses = 0;
  $('#heard').textContent = '';
  $('#caption').textContent = '';
  setCueVolume(settings.volume);
  applyTheme();
  syncSettingsForm();
  applyDevPanel();
  go('home');
  cue.done();
  say('cleared', { remember: false });
}

// ---------- Screens and prompts ----------
function go(screen) {
  app.screen = screen;
  for (const s of $$('.screen')) s.hidden = s.id !== `screen-${screen}`;
  const h = $(`#screen-${screen} h1`);
  h?.focus({ preventScroll: false });
}

function showPrompt(sel) {
  hidePrompts();
  $(sel).hidden = false;
}
function hidePrompts() {
  for (const p of $$('.prompt')) p.hidden = true;
}

// ---------- Language, theme, settings form ----------
function applyLanguage() {
  document.documentElement.lang = LANGS[settings.lang].code;
  for (const el of $$('[data-i18n]')) el.textContent = t(settings.lang, el.dataset.i18n);
  setStatus(app.status);
  syncSettingsForm();
}

function applyTheme() {
  document.documentElement.dataset.theme = settings.theme;
  document.querySelector('meta[name="theme-color"]').content = settings.theme === 'light' ? '#ffffff' : '#000000';
}

function applyDevPanel() {
  const panel = $('#devpanel');
  panel.hidden = !settings.devPanel;
  if (settings.devPanel) renderDevPanel(panel);
}

function syncSettingsForm() {
  $('#set-lang').value = settings.lang;
  $('#set-rate').value = settings.rate;
  $('#out-rate').textContent = settings.rate.toFixed(1);
  $('#set-volume').value = settings.volume;
  $('#out-volume').textContent = Math.round(settings.volume * 100) + '%';
  $('#set-theme').value = settings.theme;
  $('#set-autolisten').checked = settings.autoListen;
  $('#set-bargein').checked = settings.bargeIn;
  $('#set-sr').checked = settings.screenReader;
  $('#set-dev').checked = settings.devPanel;
}

function wireSettings() {
  $('#set-lang').addEventListener('change', (e) => setLanguage(e.target.value));
  $('#set-rate').addEventListener('change', (e) => {
    settings.rate = round1(Number(e.target.value));
    persist();
    syncSettingsForm();
    say({ text: `${t(settings.lang, 'lblRate')} ${settings.rate.toFixed(1)}` }, { remember: false });
  });
  $('#set-volume').addEventListener('change', (e) => {
    settings.volume = round1(Number(e.target.value));
    setCueVolume(settings.volume);
    persist();
    syncSettingsForm();
    say({ text: `${t(settings.lang, 'lblVolume')} ${Math.round(settings.volume * 100)}%` }, { remember: false });
  });
  $('#set-theme').addEventListener('change', (e) => {
    settings.theme = e.target.value;
    persist();
    applyTheme();
    say({ text: e.target.selectedOptions[0].textContent }, { remember: false });
  });
  const toggle = (id, key, after) =>
    $(id).addEventListener('change', (e) => {
      settings[key] = e.target.checked;
      persist();
      after?.();
      cue.done();
      const label = $(`label[for="${id.slice(1)}"]`).textContent;
      // In screen-reader mode the checkbox state is announced by the screen reader itself.
      if (!settings.screenReader) say({ text: `${label}: ${e.target.checked ? 'on' : 'off'}` }, { remember: false });
    });
  toggle('#set-autolisten', 'autoListen');
  toggle('#set-bargein', 'bargeIn');
  toggle('#set-sr', 'screenReader', () => cancelSpeech());
  toggle('#set-dev', 'devPanel', applyDevPanel);
}

// ---------- Input: tap anywhere, buttons, keyboard, typed commands ----------
function isInteractive(el) {
  return !!el.closest('button, a, input, select, textarea, label, output, .devpanel, .settings, .command-form');
}

function onTap() {
  if (!app.started) return start();
  if (app.pending === 'consent') return allowMic();
  if (app.status === 'speaking') {
    cancelSpeech();
    app.stopBargeIn?.();
    app.stopBargeIn = null;
    setStatus('idle');
    // Tap = interrupt and talk.
    if (support.stt && settings.micConsent === true) return listen();
    return;
  }
  if (app.status === 'listening') {
    stopListening();
    stopHeartbeat();
    setStatus('idle');
    return;
  }
  if (support.stt && settings.micConsent === true) return listen();
  if (support.stt && settings.micConsent !== true) {
    app.pending = 'consent';
    showPrompt('#prompt-consent');
    return say('micConsent');
  }
  return say('noRecognition');
}

function allowMic() {
  app.pending = null;
  hidePrompts();
  settings.micConsent = true;
  persist();
  listen(); // the browser shows its own permission prompt the first time
}

function declineMic() {
  app.pending = null;
  hidePrompts();
  settings.micConsent = false;
  persist();
  cue.done();
  say('micSkipped');
  $('.task')?.focus();
}

async function start() {
  if (app.started) return;
  app.started = true;
  unlockAudio();
  setCueVolume(settings.volume);
  $('#start').hidden = true;
  $('#topbar').hidden = false;
  $('#main').hidden = false;
  go('home');
  cue.done();

  const needConsent = support.stt && settings.micConsent === null;
  await say('welcome', { listenAfter: !needConsent && navigator.onLine });
  if (app.status !== 'idle') return; // interrupted or already listening

  if (!navigator.onLine) {
    app.offlineAnnounced = true;
    return say('offline', { assertive: true });
  }
  if (!support.stt) return say('noRecognition');
  if (needConsent) {
    app.pending = 'consent';
    showPrompt('#prompt-consent');
    return say('micConsent');
  }
  if (settings.micConsent === false) return say('micSkipped');
}

function wireInput() {
  $('#start').addEventListener('click', start);
  document.addEventListener('keydown', (e) => {
    if (!app.started && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      start();
    } else if (e.key === 'Escape') {
      onStop();
    }
  });

  $('#talk').addEventListener('click', onTap);
  document.addEventListener('click', (e) => {
    if (!app.started || e.target.closest('#talk, #start')) return;
    if (!isInteractive(e.target)) onTap();
  });

  for (const b of $$('[data-cmd]')) {
    b.addEventListener('click', () => {
      unlockAudio();
      app.misses = 0;
      if (b.dataset.cmd === 'stop') return onStop();
      run(b.dataset.cmd);
    });
  }
  for (const b of $$('[data-lang]')) {
    b.addEventListener('click', () => {
      app.pending = null;
      hidePrompts();
      setLanguage(b.dataset.lang);
    });
  }
  $('#btn-allow').addEventListener('click', allowMic);
  $('#btn-notnow').addEventListener('click', declineMic);
  $('#btn-yes').addEventListener('click', () => run('yes'));
  $('#btn-no').addEventListener('click', () => run('no'));

  $('#command-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#command-input');
    const text = input.value;
    input.value = '';
    if (normalize(text)) handleUtterance([text]);
  });

  window.addEventListener('offline', () => {
    stopListening();
    stopHeartbeat();
    cue.error();
    say('offline', { assertive: true, remember: false });
  });
  window.addEventListener('online', () => {
    cue.done();
    say('online', { remember: false });
  });
}

// ---------- Offline support ----------
function registerServiceWorker() {
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
  if ('serviceWorker' in navigator && !isDev) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// ---------- Boot ----------
applyTheme();
applyLanguage();
wireSettings();
wireInput();
applyDevPanel();
registerServiceWorker();
$('#start').focus();

// Exposed for automated tests only (no content is reachable through it).
window.__cc = { app, get settings() { return settings; }, handleUtterance, run, COMMANDS };
