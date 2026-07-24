<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/39d09d15-bb84-450f-bdbb-7657cd03ce4d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment Prerequisites

The `POST /api/generate-cv` endpoint (Generate Updated CV) requires a LaTeX engine binary on the server `PATH` — one of `pdflatex`, `xelatex`, `lualatex`, or `tectonic`. This is not an npm dependency and must be present in the deployment image (e.g. via `texlive-latex-recommended` or `tectonic`, depending on your base image/package manager). If no engine is found, the endpoint returns HTTP 501 with an actionable error rather than crashing.
