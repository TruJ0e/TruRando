# TruRando

TruRando is a privacy-first random group and topic assignment tool.

## Core rule

User-entered names, topics, and roster images must stay on the user's device.

TruRando is designed as a fully client-side static web app:

- no backend
- no database
- no user accounts
- no AI/API calls with user data
- no analytics containing user input
- no `localStorage`
- no `sessionStorage`
- no IndexedDB
- no saving previous randomizations
- no uploading roster images
- local-only export generation

Refreshing or closing the page clears the working data held in browser memory.

## Planned workflow

1. Paste names or upload a roster image.
2. Review/edit extracted names.
3. Paste topics.
4. Choose either number of groups or people per group.
5. Randomize members.
6. Randomly assign topics.
7. Copy or export the results locally.

## Project structure

```text
TruRando/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── randomizer.js
│   ├── ocr.js
│   └── export.js
├── assets/
├── README.md
└── PRIVACY.md
```

## Current status

Initial skeleton. Paste-based grouping is wired first. Image OCR is intentionally isolated behind `js/ocr.js` so it can later be implemented entirely in-browser without introducing a server dependency.
