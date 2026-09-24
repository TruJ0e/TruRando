// TruRando OCR boundary.
//
// This module is intentionally isolated so roster-image processing can be added
// without changing the rest of the app. The production implementation must:
// - run entirely in the browser
// - use only assets bundled with TruRando
// - never upload the image or extracted text
// - return extracted names for user review before randomization

export async function extractNamesFromImage(_file) {
  throw new Error('Local image OCR is not enabled in this skeleton yet.');
}
