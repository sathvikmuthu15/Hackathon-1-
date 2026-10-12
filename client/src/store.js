// Local storage for SETTINGS ONLY (language, speed, volume, theme, toggles) and the optional dev panel.
// Photos, documents, form answers and transcripts are never written here.

const SETTINGS_KEY = 'cc.settings.v1';
const DEV_KEY = 'cc.dev.v1';

// Saying "stop" while the app talks needs the mic open during speech. On phones that can cut off
// the app's own voice, so it starts off there (tap anywhere always works to interrupt).
const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const DEFAULT_SETTINGS = {
  lang: 'en',
  rate: 1,
  volume: 1,
  theme: 'dark',
  autoListen: true,
  bargeIn: !isMobile,
  screenReader: false,
  devPanel: false,
  micConsent: null, // null = not asked yet, true = allowed, false = declined
};

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage blocked: settings just won't persist */
  }
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...(readJSON(SETTINGS_KEY) || {}) };
}
export function saveSettings(s) {
  writeJSON(SETTINGS_KEY, s);
}

export function loadDev() {
  return readJSON(DEV_KEY) || { tasks: [], misreads: {} };
}
export function saveDev(d) {
  writeJSON(DEV_KEY, d);
}

/** "Clear everything": wipe all local storage for this app and any caches of API responses. */
export async function clearAllStorage() {
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
  // The service-worker cache only holds the app's own code (needed for offline use), never user content.
}
