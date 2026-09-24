# Attendly

Attendly is my personal attendance tracker. It keeps track of subjects, recurring
classes, and every attendance record, and shows what is at risk before the
requirement is missed.

The app runs locally and keeps my data on my machine.

## Tech stack

* React and TypeScript
* Vite
* Tailwind CSS
* Recharts
* SQLite with `sql.js`
* Vitest

## Requirements

* Node.js 22.12 or newer
* npm

## Setup

Install the dependencies:

```bash
npm ci
```

## Run locally

Start the development server:

```bash
npm run dev
```

The app will run at the address shown in the terminal.

## Production

Build the app:

```bash
npm run build
```

Start the local production server:

```bash
npm run start
```

## Useful commands

```bash
npm test          # run tests
npm run typecheck # check TypeScript
npm run build     # create production build
npm run start     # run production server
npm run verify    # typecheck + tests + build — run this before pushing
npm run audit     # dependency audit
```

## Project layout

* `src/` contains the React app and UI.
* `src/components/` contains the main app components.
* `src/lib/` contains the store, attendance math, and settings logic.
* `data/` contains the local database.
* `vite.config.ts` contains the dev-only SQLite mirror.

## How storage works

Browser storage is the source of truth: the app reads and writes it
synchronously, so every screen updates the moment something is saved.

During `npm run dev` a small Vite middleware mirrors that state to
`data/attendly.db`, which makes the data readable and recoverable with ordinary
SQLite tools. In a static production build the endpoint does not exist and the
app runs on browser storage alone.

**Settings → Export Data** writes the same state to a JSON file; **Import Data**
restores it after validating every row, so a bad file can never half-overwrite
your data.

## Privacy

Attendly collects nothing: no analytics, no tracking, no accounts, and no data
leaves your machine. Everything lives in your browser and, in development, in
`data/attendly.db`.
