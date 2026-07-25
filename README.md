<!-- <div align="right">
<img width="375" height="475" alt="GHBanner" src="assets/sherpa_photo/Gemini_Generated_Image_slijoslijoslijos-removebg-preview.png" />
</div> -->

# Sherpa

Sherpa is an AI-powered student career dashboard built for the Google AI Hackathon 2026. It helps students plan their next career move with a guided assistant, CV feedback, and internship application tracking in one place.

## What Sherpa does

Sherpa brings together three key workflows:

- AI career guidance chat for personalized next steps
- CV and resume analysis with ATS-style scoring and actionable rewrite suggestions
- Internship and graduate scheme tracking across application stages

The app is designed for students who want practical support while applying for internships, graduate roles, and other early-career opportunities.

## Core features

- Smart assistant chat powered by Gemini
- Personalized next-step recommendations based on profile and activity
- Resume/CV scoring with detailed feedback and rewritten bullet points
- CV generation from a LaTeX template for polished output
- Application tracking for Saved, Applied, Interview, and Offer stages
- Firebase-based authentication and profile storage

## Tech stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Express server with Gemini API integration
- Data: Firebase Auth + Firestore
- CV generation: LaTeX template rendering via a local LaTeX engine

## Local development

### Prerequisites

- Node.js
- A Gemini API key

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local environment file with your Gemini key:
   ```bash
   echo "GEMINI_API_KEY=your_key_here" > .env.local
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

The app runs locally at http://localhost:3000.

### Useful commands

- `npm run dev` — start the full app (Express + Vite in middleware mode)
- `npm run build` — build the frontend and bundle the server
- `npm start` — run the production build
- `npm run lint` — run TypeScript type-checking

## Project structure

- `server.ts` — Express server and Gemini API routes
- `src/` — React frontend, components, and app state
- `src/components/` — dashboard, CV tools, tracker, and auth UI
- `templates/` — LaTeX resume template used for CV generation

## Deployment notes

The CV generation endpoint depends on a LaTeX engine being available on the server path. Supported options include:

- `pdflatex`
- `xelatex`
- `lualatex`
- `tectonic`

If no LaTeX engine is installed, CV generation will return an error instead of crashing.

## Notes

This project does not include a separate test suite. Type checking is available via `npm run lint`.
