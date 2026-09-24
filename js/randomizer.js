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

export function parseLines(text) {
  return text
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
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
