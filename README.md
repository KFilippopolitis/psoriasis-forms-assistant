# Psoriasis Forms Assistant

A guided web app for completing Greek psoriasis clinical questionnaires and generating filled PDFs. Patients or study staff walk through DLQI, EQ-5D, HADS, PEST, PsAID, WPAI, and EMEA forms in one flow; answers are saved locally as a draft and exported to the official PDF templates.

## Live demo

**[Open the demo on GitHub Pages](https://kfilippopolitis.github.io/psoriasis-forms-assistant/)**

The hosted preview runs the full questionnaire UI in the browser. PDF generation on GitHub Pages shows pre-filled sample PDFs. For live PDF generation from your own answers, run the app locally (see below).

## Features

- Step-by-step questionnaire for 7 validated Greek forms
- Draft autosave in the browser (`localStorage`)
- Conditional questions (e.g. DLQI follow-ups, PEST body map)
- Server-side PDF filling with precise mark placement on official templates
- Config validation and sample PDF generation scripts

## Forms included

| Form | Description |
|------|-------------|
| DLQI | Dermatology Life Quality Index |
| EQ-5D | Health-related quality of life |
| HADS | Hospital Anxiety and Depression Scale |
| PEST | Psoriasis Epidemiology Screening Tool |
| PsAID | Psoriatic Arthritis Impact of Disease |
| WPAI | Work Productivity and Activity Impairment |
| EMEA | Patient questionnaire |

## Quick start

```bash
git clone git@github.com:KFilippopolitis/psoriasis-forms-assistant.git
cd psoriasis-forms-assistant
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Run the local server (UI + live PDF generation) |
| `npm run build:pages` | Build the static site in `docs/` for GitHub Pages |
| `npm run check` | Validate form configuration |
| `npm run sample` | Generate sample filled PDFs locally |
| `npm run pest:marks` | Regenerate PEST body-map coordinates |

## Project layout

```
public/          Web UI (HTML, CSS, app.js)
src/forms.js     Question definitions and PDF placement config
src/pdf.js       PDF filling logic (pdf-lib)
scripts/         Build, validation, and sample generators
docs/            Static GitHub Pages build (generated)
*.pdf            Official Greek form templates
```

## GitHub Pages

The demo is served from the `docs/` folder on the `main` branch.

To rebuild after changes:

```bash
npm run build:pages
git add docs/
git commit -m "Rebuild GitHub Pages demo"
git push
```

In the repository settings, set **Pages → Build and deployment → Source** to **Deploy from a branch**, branch **main**, folder **/docs**.

## How it works

1. The UI loads form definitions from `/api/forms` (or `forms.json` in static demo mode).
2. Answers are collected question by question and stored in `localStorage`.
3. On **Generate PDFs**, the server reads answers, maps each value to coordinates on the template PDFs, and writes filled files to `filled/<timestamp>/`.
4. Download links are shown for each completed form.

## Requirements

- Node.js 18+
- npm

## License

Private / internal use. PDF templates are third-party clinical instruments; use according to their respective licensing terms.
