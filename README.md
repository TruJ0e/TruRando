# TruRando

TruRando is a privacy-first random group and topic assignment tool from TruJoe Digital.

It is designed for classrooms, teams, meetings, practices, and other situations where someone needs to quickly split a list of people into random groups and optionally assign random topics.

## Privacy rule

Names, topics, roster pictures, extracted OCR text, and generated results stay on the user's device.

The production app is a static site with:

- no backend
- no database
- no accounts
- no AI/API calls with roster data
- no analytics containing user input
- no `localStorage`
- no `sessionStorage`
- no IndexedDB use by TruRando
- Tesseract OCR caching explicitly disabled (`cacheMethod: 'none'`)
- no history of prior randomizations
- no image upload endpoint
- local clipboard/export generation

Normal web-hosting requests still occur to load TruRando's own HTML, CSS, JavaScript, WebAssembly, and OCR language assets. User roster content is not included in those requests.

## Features

- Paste names, one per line
- Upload or drag/drop a roster picture
- Local in-browser OCR with self-hosted Tesseract.js assets
- Editable review of OCR results before randomizing
- Group by number of groups or people per group
- Balanced distribution of uneven group sizes
- Optional random topic assignment
- Optional topic reuse if there are fewer topics than groups
- Secure random shuffling using `crypto.getRandomValues()`
- Reroll all, members only, or topics only
- Copy one group or all groups
- Export TXT or CSV
- Print-friendly results
- Responsive mobile/desktop layout
- Duplicate-name warning without automatically deleting legitimate same-name people

## Development

Requires Node.js 22 for the tested build workflow.

```bash
npm install --ignore-scripts
npm test
npm run privacy:audit
npm run build
```

`npm run build` creates `dist/` and copies the required Tesseract.js browser bundle, worker, WebAssembly core files, and English trained-data file into the built static site. The deployed browser does not need a third-party OCR CDN.

## Project structure

```text
TruRando/
├── .github/workflows/
│   ├── ci.yml
│   └── pages.yml
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── export.js
│   ├── ocr.js
│   └── randomizer.js
├── scripts/
│   ├── build-site.mjs
│   └── privacy-audit.mjs
├── tests/
│   ├── ocr-parser.test.js
│   └── randomizer.test.js
├── index.html
├── package.json
├── PRIVACY.md
└── README.md
```

## Deployment

The repository includes a GitHub Pages workflow that builds the private-source project and deploys only the generated static `dist/` artifact. GitHub Pages must be configured to use GitHub Actions in the repository settings before the first successful deployment.

Planned custom domain: `trurando.trujoedigital.com`.
