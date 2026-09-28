function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer.');
  }

  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const buffer = new Uint32Array(1);
  let value;

  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return value % maxExclusive;
}

export function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

const ABBREVIATIONS = /^(mr|mrs|ms|dr|st|jr|sr|vs|etc|inc|ltd|co)$/i;
const LEADING_MARKER = /^(\d+[.)\]]|[(]\d+[)]|[•\-\*–—>])\s*/;
const MARKER_ONLY = /^(\d+[.)\]]?|[(]\d+[)]|[•\-\*–—>])$/;

// Worksheet chrome that leaks in when teachers paste straight from a
// practice sheet: titles, section headers, praise stamps, approval stamps,
// headers, footers, and page markers. Real entries (even misspelled ones
// like "Toppiks to Tawk About") never match these, so they survive.
const JUNK_LINE_PATTERNS = [
  /^\s*page\s+\d+(\s*of\s+\d+)?\s*$/i, // Page 1 of 1
  /teacher'?s?\s+stamp/i, // Teacher Stamp: ...
  /stamp\s*:\s*approved/i, // Stamp: APPROVED
  /approved\s*[✅✔✓☑]/i, // APPROVED ✅
  /\bactivity\s+sheet\b/i, // ... Activity Sheet
  /\bpractice\s+sheet\b/i, // ... Practice Sheet
  /\banswer\s+key\b/i,
  /\bsta?rr?\s+count\s*:/i, // Starr Count: ★★★★★
  /\bgreat\s+jo[bp]\b/i, // GREAT JOB! / GREAT JOP!
  /\bgood\s+sharing\b/i, // GOOD SHARING ...
  /^\s*[✎☰]/, // ✎ Freinds Names ... / ☰ Toppiks to Tawk About
  /©|copyright/i,
  /^(name|date)\s*[:_]/i, // Name: ___ / Date: ___
  /^[A-Z0-9\s'’&!?.*\-]*[A-Z][A-Z0-9\s'’&!?.*\-]*!$/, // ALL-CAPS titles ending in !
];
const NO_ALNUM = /^[^A-Za-z0-9]*$/; // only emoji / symbols / punctuation

function isJunkLine(value) {
  if (NO_ALNUM.test(value)) return true;
  return JUNK_LINE_PATTERNS.some((pattern) => pattern.test(value));
}

function splitOnPeriods(text) {
  const out = [];
  let current = '';
  const tokens = text.split(/(\. +)/);
  for (let i = 0; i < tokens.length; i += 2) {
    const candidate = current + tokens[i];
    const delim = tokens[i + 1] || '';
    const lastWord = (candidate.match(/([A-Za-z]+)\s*$/) || [])[1] || '';
    if (delim && ABBREVIATIONS.test(lastWord)) {
      current = `${candidate}. `;
    } else {
      if (candidate) out.push(candidate);
      current = '';
    }
  }
  if (current) out.push(current);
  return out;
}

function cleanEntry(value) {
  const collapsed = value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.*$/, '')
    .trim();
  if (!collapsed || MARKER_ONLY.test(collapsed) || isJunkLine(collapsed)) return '';
  const stripped = collapsed.replace(LEADING_MARKER, '').trim();
  if (!stripped || MARKER_ONLY.test(stripped) || isJunkLine(stripped)) return '';
  return stripped;
}

export function parseLines(text) {
  return text
    .split(/[\r\n,;]+/)
    .flatMap(splitOnPeriods)
    .map(cleanEntry)
    .filter(Boolean);
}

export function parseTopics(text) {
  return parseLines(text);
}

export function findDuplicateEntries(items) {
  const seen = new Map();
  const duplicates = new Set();

  for (const item of items) {
    const key = item.toLocaleLowerCase();
    if (seen.has(key)) duplicates.add(seen.get(key));
    else seen.set(key, item);
  }

  return [...duplicates];
}

export function getGroupCount(nameCount, mode, value) {
  if (!Number.isInteger(nameCount) || nameCount < 1) {
    throw new Error('Add at least one name.');
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Group setting must be a whole number greater than 0.');
  }

  if (mode === 'groups') {
    if (value > nameCount) {
      throw new Error(`You cannot make ${value} non-empty groups from ${nameCount} people.`);
    }
    return value;
  }

  if (mode === 'size') {
    return Math.ceil(nameCount / value);
  }

  throw new Error('Choose a valid grouping mode.');
}

export function buildGroups(names, mode, value) {
  const groupCount = getGroupCount(names.length, mode, value);
  const shuffledNames = shuffle(names);
  const groups = Array.from({ length: groupCount }, () => []);

  shuffledNames.forEach((name, index) => {
    groups[index % groupCount].push(name);
  });

  return groups;
}

export function assignTopics(groups, topics, allowReuse = false) {
  if (!topics.length) {
    return groups.map((members) => ({ members: [...members], topic: '' }));
  }

  if (topics.length >= groups.length) {
    const shuffledTopics = shuffle(topics);
    return groups.map((members, index) => ({
      members: [...members],
      topic: shuffledTopics[index]
    }));
  }

  if (!allowReuse) {
    throw new Error('Add at least one topic per group, or allow topic reuse.');
  }

  const assignedTopics = [];
  while (assignedTopics.length < groups.length) {
    assignedTopics.push(...shuffle(topics));
  }

  return groups.map((members, index) => ({
    members: [...members],
    topic: assignedTopics[index]
  }));
}

export function summarizeGroups(groups) {
  const people = groups.reduce((total, group) => total + group.members.length, 0);
  const sizes = groups.map((group) => group.members.length);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  const sizeLabel = minSize === maxSize
    ? `${minSize} per group`
    : `${minSize}–${maxSize} per group`;

  return `${people} ${people === 1 ? 'person' : 'people'} • ${groups.length} ${groups.length === 1 ? 'group' : 'groups'} • ${sizeLabel}`;
}
