# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Sherpa is a student career dashboard: AI career guidance chat, CV/resume scoring & rewriting, and internship/graduate application tracking. Built with AI Studio and deployed as a Cloud Run applet (see `firebase-applet-config.json`, `metadata.json`). Frontend is React + Vite + Tailwind; backend is a single Express server that proxies to the Gemini API.

## Commands

- `npm run dev` — starts the Express server (via `tsx server.ts`), which mounts Vite in middleware mode for HMR. This is the only way to run the app locally (there's no separate frontend-only dev server).
- `npm run build` — builds the Vite frontend, then bundles `server.ts` into `dist/server.cjs` with esbuild.
- `npm start` — runs the production build (`node dist/server.cjs`).
- `npm run lint` — type-checks the whole project with `tsc --noEmit` (there is no separate test suite or linter configured).

There is no test runner in this repo.

## Architecture

**Single Express server does double duty** (`server.ts`): in dev it creates a Vite server in middleware mode and mounts it (`app.use(vite.middlewares)`); in production it serves the static `dist/` build and falls back to `index.html` for SPA routing. All Gemini API calls happen server-side in this file — the frontend never calls `@google/genai` directly, only `fetch('/api/...')`.

**Gemini endpoints in `server.ts`** (model: `gemini-3.6-flash`):
- `POST /api/assistant` — chat-style career assistant, takes message history + user profile context.
- `POST /api/next-step` — generates a single prioritized "next step" recommendation as strict JSON.
- `POST /api/analyze-cv` — scores an uploaded CV (PDF via base64 `inlineData`, or plain `cvText`), returns structured scores/tips/rewrites as JSON.
- `POST /api/fetch-internships` — uses Gemini's `googleSearch` tool grounding to find live internship listings; has a hardcoded fallback listing if grounded JSON parsing fails.

All JSON-mode endpoints prompt Gemini for "strict JSON" and pass the response through `cleanJsonText()` to strip markdown code fences before `JSON.parse`. When adding a new AI JSON endpoint, follow this same clean-then-parse pattern and provide a fallback for parse failures (see `/api/fetch-internships` and `/api/next-step`).

**Auth & data are entirely client-side Firebase**, no custom backend auth:
- `src/lib/firebase.ts` initializes Firebase from `firebase-applet-config.json` (checked into repo, not `.env`) and picks the Firestore database via `firestoreDatabaseId` (may be a named DB, not `(default)`).
- `src/context/AuthContext.tsx` wraps Firebase Auth (Google popup + email/password) and lazily creates a `users/{uid}` profile doc on first sign-in. `updateUserProfile` merges partial updates and strips `undefined` values recursively (`cleanFirestoreData`) before every Firestore write, since Firestore rejects `undefined`.
- Username uniqueness is enforced via a separate `usernames/{username}` collection acting as a claim/lock, written whenever a profile sets/changes `username`.
- `src/App.tsx` subscribes directly to Firestore (`onSnapshot`) for `applications` and `cvAnalyses` scoped to `currentUser.uid` — there's no intermediate data-fetching layer/hook, components read Firestore straight from the top-level `MainApp` component and pass data down as props.
- Firestore security (`firestore.rules`) is broad: most collections just require `isAuthenticated()`, not per-user ownership checks (exception: `users/{userId}` writes require `isOwner(userId)`). Keep this in mind — client code, not rules, is currently the main safeguard around per-user data scoping.

**Frontend structure**: `src/App.tsx` is a single-page tab switcher (`dashboard` / `cv` / `tracker`, no router) rendering feature folders under `src/components/`: `Dashboard/` (assistant chat, next-step card, activity feed), `CvImprover/` (score dial, analysis view), `Tracker/` (internship tracker). `src/types.ts` is the single source of truth for all shared domain types (`UserProfile`, `CvAnalysis`, `ApplicationRecord`, `Internship`, `ActivityItem`, etc.) — check there before adding new shape definitions.

**Env vars**: `GEMINI_API_KEY` is required server-side (`server.ts` throws if missing when a Gemini call is attempted). In the AI Studio/Cloud Run deployment this and `APP_URL` are injected automatically; see `.env.example`.
