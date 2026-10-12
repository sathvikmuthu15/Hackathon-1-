# Cantina Cuhh — TODO

Single source of truth. Tick items when done, add new items as they come up, and note blockers inline as **BLOCKED:**.
Theme: *Software Solutions for the Specially Abled*. A voice-first PWA that helps blind and low-vision users read print, fill forms and find their way around.

## Setup
- [x] Clone repo (was empty)
- [x] `.gitignore` written before first commit (includes `.env`)
- [x] `TODO.md` created and committed first
- [x] Project scaffold: Vite client (vanilla JS) + Express server + `ai/` folder
- [x] npm scripts: `dev` (client + server together), `build`, `start`
- [ ] Owner runs `npm install` + `npm run dev` locally and confirms it starts (owner action)
- [x] Local HTTPS for phone testing via `@vitejs/plugin-basic-ssl` (self-signed; untested on a phone)
- [ ] Confirm push to GitHub works (or hand over manual push commands)

## Secrets/.env
- [x] `.env.example` with placeholders only (AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, PORT, MAX_IMAGE_MB)
- [ ] `ai/provider.js` abstraction (Gemini | Anthropic chosen by AI_PROVIDER; model names from env only)
- [ ] Look up current model names and request formats in the provider docs (no guessing)
- [ ] Server refuses to start AI routes with a clear message if key/model is missing (never prints the key)
- [x] Image size limit (MAX_IMAGE_MB) + basic rate limiting on the proxy (20 req/min on /api/ai)
- [ ] `git status` check before every commit — `.env` never staged
- [ ] Owner puts the real key in local `.env` (owner action)

## Module 1 — Voice home and navigation
- [ ] Spoken welcome + command list on load (needs one tap first because browsers block autoplay audio)
- [ ] Commands: read this, fill a form, places near me, repeat, stop, slower, faster, help, change language, go home, clear everything
- [ ] Command matching in English, Tamil, Hindi (synonyms + fuzzy match)
- [ ] Audio cues (Web Audio tones): listening, thinking, done, error
- [ ] "Thinking" heartbeat cue so silence never exceeds ~2 s
- [ ] Spoken confirmation after every action
- [ ] Interrupt speech by "stop" or tapping anywhere
- [ ] Adjustable speech rate and volume (persisted locally as a setting, not content)
- [ ] Language switch en-IN / ta-IN / hi-IN, with UI strings translated
- [ ] Warn when the device has no voice installed for the chosen language
- [ ] SpeechRecognition unsupported (iOS Safari) → announce + big tap-anywhere controls + device keyboard dictation field
- [ ] Semantic HTML, ARIA labels, live regions, logical focus order, 48px+ targets, high contrast, keyboard operable
- [ ] Done check: whole home flow with eyes closed

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
- [ ] Spoken consent before camera, mic and location, with one-sentence reason
- [ ] "Clear everything" wipes in-memory state, settings and dev-panel data
- [ ] Spoken errors with next step: offline, permission denied, API failure, rate limited, image too large
- [ ] Service worker: home + help work offline; features say when they need internet
- [ ] Dev panel (off by default, localStorage only): task times + misread counts, no content

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
