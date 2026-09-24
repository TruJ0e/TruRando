export function groupsToText(groups) {
  return groups
    .map((group, index) => {
      const heading = group.topic
        ? `Group ${index + 1} — ${group.topic}`
        : `Group ${index + 1}`;

      return [heading, ...group.members].join('\n');
    })
    .join('\n\n');
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
  await navigator.clipboard.writeText(text);
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
  URL.revokeObjectURL(url);
}
