# Cantina Cuhh — TODO

Single source of truth. Tick items when done, add new items as they come up, and note blockers inline as **BLOCKED:**.
Theme: *Software Solutions for the Specially Abled*. A voice-first PWA that helps blind and low-vision users read print, fill forms and find their way around.

## Setup
- [x] Clone repo (was empty)
- [x] `.gitignore` written before first commit (includes `.env`)
- [x] `TODO.md` created and committed first
- [x] Project scaffold: Vite client (vanilla JS) + Express server + `ai/` folder
- [x] npm scripts: `dev` (client + server together), `build`, `start`
- [ ] Owner installs Node.js 22 LTS, runs `npm install` + `npm run dev` and confirms it starts (owner action) — **BLOCKED:** npm not installed on owner's PC yet
- [x] Local HTTPS for phone testing via `@vitejs/plugin-basic-ssl` (self-signed; untested on a phone)
- [ ] Confirm push to GitHub works (or hand over manual push commands) — first bundle had no HEAD; fixed bundle delivered

## Secrets/.env
- [x] `.env.example` with placeholders only (AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, PORT, MAX_IMAGE_MB)
- [ ] `ai/provider.js` abstraction (Gemini | Anthropic chosen by AI_PROVIDER; model names from env only)
- [ ] Look up current model names and request formats in the provider docs (no guessing)
- [ ] Server refuses to start AI routes with a clear message if key/model is missing (never prints the key)
- [x] Image size limit (MAX_IMAGE_MB) + basic rate limiting on the proxy (20 req/min on /api/ai)
- [ ] `git status` check before every commit — `.env` never staged
- [ ] Owner puts the real key in local `.env` (owner action)

## Module 1 — Voice home and navigation
- [x] Spoken welcome + command list on load (needs one tap first because browsers block autoplay audio)
- [x] Commands: read this, fill a form, places near me, repeat, stop, slower, faster, help, change language, go home, clear everything
- [x] Command matching in English, Tamil, Hindi (synonyms + fuzzy match)
- [x] Audio cues (Web Audio tones): listening, thinking, done, error
- [x] Heartbeat cue while listening (every 2 s) and helper for thinking (used from Module 2)
- [x] Spoken confirmation after every action
- [x] Interrupt speech by "stop" or tapping anywhere
- [x] Adjustable speech rate and volume (persisted locally as a setting, not content)
- [x] Language switch en-IN / ta-IN / hi-IN, with UI strings translated
- [x] Warn when the device has no voice installed for the chosen language
- [x] SpeechRecognition unsupported (iOS Safari) → announce + big tap-anywhere controls + device keyboard dictation field
- [x] Semantic HTML, ARIA labels, live regions, logical focus order, 48px+ targets, high contrast, keyboard operable (built; not yet tested with a real screen reader)
- [x] Screen-reader mode setting (app voice off, live regions only) so TalkBack/VoiceOver don't talk over the app
- [x] Every voice command also has a button and a typed/dictated command box
- [x] Unit tests for command matching (`npm test`, 9 passing) + headless browser run with mocked speech
- [ ] Settings checkboxes are 32px (label row is 48px) — consider bigger
- [ ] Barge-in ("stop" while speaking) is off by default on phones; test on a real Android phone
- [ ] Done check: whole home flow with eyes closed (owner, on a real phone)
- [ ] Tamil and Hindi strings reviewed by a native speaker

## Module 2 — Camera reader with spoken guidance
- [ ] Rear camera via getUserMedia, spoken consent first
- [ ] Client-side checks on a downscaled frame: brightness, blur (Laplacian variance), content bounds (edge box)
- [ ] Spoken guidance with throttling: move closer/back, tilt up/down, too dark, blurry, "whole page visible, capturing now"
- [ ] Auto-capture when stable for ~1 s; manual capture by tap or "capture"
- [ ] At most occasional AI framing checks (never per frame)
- [ ] Modes: document, medicine label, currency note, general object
- [ ] AI returns strict JSON: content, key facts, confidence, unreadable parts, language
- [ ] Read result aloud in chosen language
- [ ] Voice follow-ups on the same capture ("what is the total?", "due date?", "read slower") — image kept in memory only
- [ ] Low confidence spoken out loud; medicine/doses/expiry/money always add the confirm-with-a-person warning
- [ ] Sample bill + sample medicine label (fictional, marked SAMPLE) for testing
- [ ] Done check: sample bill and label read correctly by voice only

## Module 3 — Form and document assistant
- [ ] Fictional SAMPLE form (clearly labelled, not imitating any government form)
- [ ] Load sample form OR photograph a paper form
- [ ] AI extracts fields as JSON (label, type, required, hint)
- [ ] One field at a time by voice; read back and confirm
- [ ] "go back", "skip", "repeat"
- [ ] Spelling mode for names (letter by letter) and digit-by-digit numbers
- [ ] Full summary read-out → confirm
- [ ] Output: printable/downloadable HTML copy + plain-text version read aloud
- [ ] Done check: complete sample form by voice and download it

## Module 4 (stretch) — Barrier and place map
- [ ] Only after Modules 1–3 are solid
- [ ] Leaflet + OpenStreetMap tiles
- [ ] Pin types: accessible, hazard, helpful note
- [ ] Add pin by voice at current location with dictated note
- [ ] Read nearby notes aloud (sorted by distance)
- [ ] Seed pins labelled SAMPLE; no personal identifiers
- [ ] UI + README note: crowd-sourced, may be outdated

## Privacy/Safety
- [ ] No photos, documents, form answers or transcripts stored by default (memory only)
- [ ] Server: no request-body logging, no content in error logs
- [ ] Spoken consent before camera, mic ✔ and location, with one-sentence reason
- [x] "Clear everything" wipes in-memory state, settings and dev-panel data
- [ ] Spoken errors with next step: offline ✔, mic denied ✔, API failure, rate limited, image too large (Module 2)
- [x] Service worker: home + help work offline; features say when they need internet (built; offline test on a phone pending)
- [x] Dev panel (off by default, localStorage only): task times + misread counts, no content

## Accessibility testing
- [ ] `docs/ACCESSIBILITY_TEST.md` checklist (tested vs not yet)
- [ ] TalkBack (Android Chrome)
- [ ] VoiceOver (iOS Safari)
- [ ] Keyboard only (desktop)
- [ ] Contrast check (AA, high-contrast theme)
- [ ] Speech speed range usable
- [ ] Automated scan (axe) on each screen

## Docs
- [ ] README: problem, features, setup, env vars, 3-minute demo script, limitations, real vs sample data
- [ ] `docs/ACCESSIBILITY_TEST.md`
- [ ] Architecture note (client / proxy / provider)

## Demo prep
- [ ] Phone charged
- [ ] HTTPS working on the phone
- [ ] Camera, mic, location permissions pre-granted
- [ ] Sample form printed
- [ ] Sample bill + medicine label printed
- [ ] Backup screen recording
- [ ] Key set locally in `.env`
- [ ] Offline fallback tested (airplane mode → home + help still work)

## Pitch
- [ ] Problem slide with evidence
- [ ] Live demo flow (3 min)
- [ ] Honest limitations slide (AI can misread; always confirm)
- [ ] Impact + next steps

## Don't forget
- [ ] Test with at least one real visually impaired user
- [ ] Honest limitations slide (AI can misread; always confirm)
- [ ] Team roles decided
- [ ] Submission deadline and format confirmed
- [ ] Rotate any key that was ever exposed

## Known issues
- Browsers block audio until the first user gesture, so the welcome plays after the first tap or key press.
- Web Speech recognition in Chrome sends audio to Google's servers; not available offline. Disclose in README.
- Tamil/Hindi voice output depends on the voices installed on the device.
- **BLOCKED (install/test):** the cloud workspace cannot reach the npm registry, so `npm install`, `vite build` and the Express server can only be run on the owner's machine. Pure-JS logic is tested here with plain Node; UI tested in headless Chromium without Vite.
- **BLOCKED (push):** the cloud workspace's GitHub token is invalid, so pushing goes through the owner's machine (see manual commands).
