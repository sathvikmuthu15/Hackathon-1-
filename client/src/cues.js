// Short audio cues made with Web Audio, so they work offline and need no sound files.
// Each one has a different pitch and pattern, so they can be told apart without looking.
//   listening: two rising notes   thinking: one soft low tick (repeats)
//   done:      bright high ding   error:    two falling low buzzes

let ctx = null;
let masterVolume = 0.8;

export function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
}

export function setCueVolume(v) {
  masterVolume = Math.max(0, Math.min(1, v));
}

function tone(freq, start, dur, { type = 'sine', gain = 0.25 } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const peak = gain * masterVolume;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const cue = {
  listening() {
    tone(660, 0, 0.12);
    tone(990, 0.13, 0.16);
  },
  thinking() {
    tone(330, 0, 0.08, { type: 'triangle', gain: 0.12 });
  },
  listeningPulse() {
    tone(1200, 0, 0.04, { gain: 0.05 });
  },
  done() {
    tone(1320, 0, 0.22, { gain: 0.2 });
  },
  error() {
    tone(220, 0, 0.18, { type: 'square', gain: 0.12 });
    tone(165, 0.22, 0.26, { type: 'square', gain: 0.12 });
  },
};

// Heartbeat: while something is in progress, tick so there is never more than ~2 s of silence.
let heartbeatTimer = null;
export function startHeartbeat(kind = 'thinking', everyMs = 1500) {
  stopHeartbeat();
  const fn = kind === 'listening' ? cue.listeningPulse : cue.thinking;
  fn();
  heartbeatTimer = setInterval(fn, everyMs);
}
export function stopHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}
