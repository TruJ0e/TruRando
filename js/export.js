export function groupToText(group, index) {
  const heading = group.topic
    ? `Group ${index + 1} — ${group.topic}`
    : `Group ${index + 1}`;

  return [heading, ...group.members].join('\n');
}

export function groupsToText(groups) {
  return groups.map(groupToText).join('\n\n');
}

export function groupsToCsv(groups) {
  const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [['Group', 'Topic', 'Member']];

  groups.forEach((group, index) => {
    group.members.forEach((member) => {
      rows.push([String(index + 1), group.topic || '', member]);
    });
  });

  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export async function copyText(text) {
  // Modern async clipboard API first — but a rejection must fall through to
  // the legacy path, not surface as an error (some browsers expose the API
  // yet deny the write, e.g. permission policy or background tab).
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  // iOS Safari only honors execCommand('copy') on a focused, selectable
  // element — opacity:0 with no focus silently fails there.
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '2em';
  textarea.style.height = '2em';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  textarea.remove();

  if (!copied) throw new Error('Copy failed.');
}

export function downloadText(filename, contents, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
