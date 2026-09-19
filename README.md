## Tada — AI companion for senior citizens

Live demo: [AI Studio link]
GitHub: this repo

### Problem
Senior citizens don't lack reminder apps — they lack confidence to act alone
without fear of scams or mistakes.

### Solution
Tada is an agentic Gemini app: voice commands trigger real actions (opens
fraud checker, screen coach, practice room) via function calling — not just
chat replies.

### Security note
This demo uses a client-side API key for hackathon speed. Production would
proxy Gemini calls through a server endpoint to avoid exposing the key.

### Testing
Basic test scaffold included via Vitest (`npm run test`).
