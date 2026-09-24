import test from 'node:test';
import assert from 'node:assert/strict';
import { extractNamesFromText } from '../js/ocr.js';

test('OCR parser removes common bullets and numbering', () => {
  const result = extractNamesFromText('1. Alex Smith\n• Jordan Lee\n3) Taylor Brown');
  assert.deepEqual(result, ['Alex Smith', 'Jordan Lee', 'Taylor Brown']);
});

test('OCR parser removes empty/header-only lines', () => {
  const result = extractNamesFromText('Roster\n\nAlex Smith\nStudents\nJordan Lee');
  assert.deepEqual(result, ['Alex Smith', 'Jordan Lee']);
});
