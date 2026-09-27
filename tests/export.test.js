import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { copyText, groupsToText } from '../js/export.js';

const origNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

function setNavigator(value) {
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreNavigator() {
  if (origNavigatorDesc) {
    Object.defineProperty(globalThis, 'navigator', origNavigatorDesc);
  } else {
    restoreNavigator();
  }
}
function makeTextarea() {
  const calls = [];
  return {
    value: '',
    style: {},
    calls,
    setAttribute() {},
    focus() { calls.push('focus'); },
    select() { calls.push('select'); },
    setSelectionRange(start, end) { calls.push(['setSelectionRange', start, end]); },
    remove() { calls.push('remove'); },
  };
}

describe('copyText', () => {
  let textareas;
  let execCommandResult;
  let execCommandCalls;

  beforeEach(() => {
    textareas = [];
    execCommandResult = true;
    execCommandCalls = [];
    globalThis.document = {
      createElement(tag) {
        assert.equal(tag, 'textarea');
        const el = makeTextarea();
        textareas.push(el);
        return el;
      },
      body: { appendChild() {} },
      execCommand(cmd) {
        execCommandCalls.push(cmd);
        return execCommandResult;
      },
    };
  });

  afterEach(() => {
    delete globalThis.document;
    restoreNavigator();
  });

  it('uses the async clipboard API when it resolves', async () => {
    let written;
    setNavigator({ clipboard: { writeText: async (t) => { written = t; } } });
    await copyText('hello');
    assert.equal(written, 'hello');
    assert.equal(textareas.length, 0);
  });

  it('falls back to execCommand when clipboard.writeText rejects', async () => {
    setNavigator({ clipboard: { writeText: async () => { throw new Error('denied'); } } });
    await copyText('fallback text');
    assert.equal(textareas.length, 1);
    const ta = textareas[0];
    assert.equal(ta.value, 'fallback text');
    assert.ok(ta.calls.includes('focus'), 'textarea must be focused (iOS Safari requirement)');
    assert.ok(ta.calls.includes('select'));
    assert.deepEqual(
      ta.calls.find((c) => Array.isArray(c)),
      ['setSelectionRange', 0, 'fallback text'.length]
    );
    assert.deepEqual(execCommandCalls, ['copy']);
    assert.ok(ta.calls.includes('remove'));
  });

  it('uses the legacy path when no clipboard API exists', async () => {
    setNavigator({});
    await copyText('legacy');
    assert.equal(textareas.length, 1);
    assert.deepEqual(execCommandCalls, ['copy']);
  });

  it('throws when both paths fail', async () => {
    setNavigator({ clipboard: { writeText: async () => { throw new Error('denied'); } } });
    execCommandResult = false;
    await assert.rejects(() => copyText('nope'), /Copy failed/);
  });

  it('groupsToText formats groups as plain pasteable text', () => {
    const groups = [
      { topic: 'Alpha', members: ['Amy', 'Bob'] },
      { topic: '', members: ['Cat'] },
    ];
    assert.equal(groupsToText(groups), 'Group 1 — Alpha\nAmy\nBob\n\nGroup 2\nCat');
  });
});
