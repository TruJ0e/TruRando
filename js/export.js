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
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
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
