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

export function buildGroups(names, mode, value) {
  if (!names.length) {
    throw new Error('Add at least one name.');
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Group setting must be a whole number greater than 0.');
  }

  const shuffledNames = shuffle(names);
  const groupCount = mode === 'size'
    ? Math.ceil(shuffledNames.length / value)
    : Math.min(value, shuffledNames.length);

  if (groupCount < 1) {
    throw new Error('Unable to create groups from these settings.');
  }

  const groups = Array.from({ length: groupCount }, () => []);

  shuffledNames.forEach((name, index) => {
    groups[index % groupCount].push(name);
  });

  return groups;
}

export function assignTopics(groups, topics, allowReuse = false) {
  if (!topics.length) {
    return groups.map((members) => ({ members, topic: '' }));
  }

  if (!allowReuse && topics.length < groups.length) {
    throw new Error('Add at least one topic per group, or allow topic reuse.');
  }

  if (allowReuse) {
    return groups.map((members) => ({
      members,
      topic: topics[secureRandomInt(topics.length)]
    }));
  }

  const shuffledTopics = shuffle(topics);

  return groups.map((members, index) => ({
    members,
    topic: shuffledTopics[index] || ''
  }));
}
