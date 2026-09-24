import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignTopics,
  buildGroups,
  findDuplicateEntries,
  getGroupCount,
  parseLines
} from '../js/randomizer.js';

const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

test('parseLines trims blank lines', () => {
  assert.deepEqual(parseLines(' Alice \n\nBob\r\n '), ['Alice', 'Bob']);
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
