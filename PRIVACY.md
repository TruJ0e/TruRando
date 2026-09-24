# TruRando Privacy Design

TruRando is intentionally designed so roster data does not need to leave the user's browser.

## User data covered by this design

- names pasted or typed into the app
- roster pictures selected from the user's device
- text extracted from roster pictures
- topics entered by the user
- generated groups and topic assignments

## Required behavior

The data above is processed in browser memory only.

TruRando must not intentionally:

- send user-entered data to an AI service
- send roster pictures to an OCR API
- send names, topics, OCR text, or results to an application server
- store user-entered data in a database
- store user-entered data in `localStorage`
- store user-entered data in `sessionStorage`
- use IndexedDB to persist TruRando inputs/results
- save previous randomizations
- include user-entered data in analytics or telemetry

## Local OCR

TruRando uses Tesseract.js in the browser. Its JavaScript worker, WebAssembly core, and English trained-data file are copied into the built static site during deployment and served from the same TruRando origin.

Runtime OCR is configured with `cacheMethod: 'none'`, which disables Tesseract's browser cache reads and writes. Roster pictures are provided directly to the local worker and are not sent to a remote OCR endpoint.

After OCR completes, the worker is terminated and the temporary image canvas is cleared. The extracted lines are copied into the editable names field so the user can review/correct OCR mistakes before randomizing.

## Network restrictions

The application Content Security Policy restricts `connect-src` to the same origin. Application source code does not include third-party runtime URLs.

Static hosting still receives ordinary requests required to deliver TruRando's own HTML, CSS, JavaScript, WebAssembly, and OCR language assets. Those requests must not contain roster content.

## Randomization

Randomization uses the browser Web Crypto API (`crypto.getRandomValues`) and an unbiased Fisher-Yates shuffle. No remote randomization service is used.

## Export

Copy, TXT, and CSV output are generated locally. Downloads use browser `Blob` objects and do not require upload processing.

## Lifecycle

Working data exists only for the current page session in memory. Resetting, refreshing, navigating away from, or closing the page does not intentionally preserve the roster, topics, picture, OCR text, or results.

## Automated guardrail

`scripts/privacy-audit.mjs` checks first-party app source for direct persistent-storage calls, external URLs, WebSockets, beacon telemetry, and an incorrectly relaxed network policy. CI runs this check with the unit tests before building/deploying.

## Important limitation

A browser and hosting provider may maintain ordinary browser cache, HTTP cache, request logs, or security logs for the static application files themselves. TruRando's design prevents roster data from being intentionally added to those requests; it does not claim to disable the browser's normal caching of public application assets.
