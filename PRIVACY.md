# TruRando Privacy Design

TruRando is designed so the data used for randomization does not need to leave the user's browser.

## User data covered by this design

- names pasted or typed into the app
- roster images selected from the user's device
- text extracted from roster images
- topics entered by the user
- generated groups and topic assignments

## Required behavior

All of the data above must be processed in browser memory only.

TruRando must not intentionally:

- send user-entered data to an AI service
- send roster images to an OCR API
- send names, topics, or results to a server
- store user-entered data in a database
- store user-entered data in `localStorage`
- store user-entered data in `sessionStorage`
- store user-entered data in IndexedDB
- save previous randomizations
- include user-entered data in analytics or telemetry

## Image OCR

When image OCR is implemented, the OCR engine and required language/model assets must be bundled with the static site and execute locally in the browser. The image must not be uploaded for processing.

The extracted text should be shown to the user for review and correction before randomization.

## Randomization

Randomization should use the browser's Web Crypto API (`crypto.getRandomValues`) rather than a remote service.

## Export

Copy and export operations are generated locally. TXT and CSV downloads are created with browser `Blob` objects and do not require a server upload.

## Lifecycle

Working data exists only for the current page session in memory. Resetting, refreshing, navigating away from, or closing the page must not intentionally preserve the roster, topics, or results.

## Hosting note

Normal static hosting infrastructure may receive standard web requests required to deliver TruRando's HTML, CSS, JavaScript, and bundled assets. User roster content must never be added to those requests.
