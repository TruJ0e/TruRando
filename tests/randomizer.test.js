import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignTopics,
  buildGroups,
  findDuplicateEntries,
  getGroupCount,
  parseLines,
  parseTopics
} from '../js/randomizer.js';

const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

test('parseLines trims blank lines', () => {
  assert.deepEqual(parseLines(' Alice \n\nBob\r\n '), ['Alice', 'Bob']);
});

test('parseLines splits comma-, semicolon-, and period-separated names', () => {
  assert.deepEqual(
    parseLines('John Jakob, Alex Smith, September November'),
    ['John Jakob', 'Alex Smith', 'September November']
  );
  assert.deepEqual(parseLines('A; B\nC,D'), ['A', 'B', 'C', 'D']);
  assert.deepEqual(parseLines('John Jakob. Alex Smith. Mia.'), ['John Jakob', 'Alex Smith', 'Mia']);
});

test('parseTopics splits on periods like voice dictation', () => {
  assert.deepEqual(
    parseTopics('Leadership. Motivation. TED talks. Powerpuff Girls.'),
    ['Leadership', 'Motivation', 'TED talks', 'Powerpuff Girls']
  );
  assert.deepEqual(parseTopics('A, B\nC'), ['A', 'B', 'C']);
});

test('findDuplicateEntries is case-insensitive without deleting names', () => {
  assert.deepEqual(findDuplicateEntries(['Alex', 'Sam', 'alex']), ['Alex']);
});

test('buildGroups makes balanced groups and uses every name once', () => {
  const groups = buildGroups(names, 'groups', 3);
  const sizes = groups.map((group) => group.length);
  assert.equal(groups.length, 3);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
  assert.deepEqual([...groups.flat()].sort(), [...names].sort());
});

test('people-per-group chooses the required number of groups', () => {
  assert.equal(getGroupCount(10, 'size', 4), 3);
});

test('too many non-empty groups is rejected', () => {
  assert.throws(() => buildGroups(['A', 'B'], 'groups', 3), /cannot make/i);
});

test('topics are unique when enough topics exist', () => {
  const groups = buildGroups(names, 'groups', 3);
  const results = assignTopics(groups, ['T1', 'T2', 'T3', 'T4'], true);
  assert.equal(new Set(results.map((result) => result.topic)).size, 3);
});

test('topic reuse fills all groups only when enabled', () => {
  const groups = buildGroups(names, 'groups', 4);
  assert.throws(() => assignTopics(groups, ['T1', 'T2'], false), /allow topic reuse/i);
  const results = assignTopics(groups, ['T1', 'T2'], true);
  assert.equal(results.length, 4);
  assert.ok(results.every((result) => ['T1', 'T2'].includes(result.topic)));
});
