import {
  assignTopics,
  buildGroups,
  findDuplicateEntries,
  getGroupCount,
  parseLines,
  summarizeGroups
} from './randomizer.js';
import { copyText, downloadText, groupToText, groupsToCsv, groupsToText } from './export.js';
import { extractNamesFromImage } from './ocr.js';

const namesInput = document.querySelector('#names');
const topicsInput = document.querySelector('#topics');
const nameCount = document.querySelector('#nameCount');
const duplicateNotice = document.querySelector('#duplicateNotice');
const groupPreview = document.querySelector('#groupPreview');
const groupValue = document.querySelector('#groupValue');
const groupValueLabel = document.querySelector('#groupValueLabel');
const allowTopicReuse = document.querySelector('#allowTopicReuse');
const randomizeButton = document.querySelector('#randomizeButton');
const resultsSection = document.querySelector('#resultsSection');
const resultsContainer = document.querySelector('#results');
const resultsSummary = document.querySelector('#resultsSummary');
const errorMessage = document.querySelector('#errorMessage');
const copyButton = document.querySelector('#copyButton');
const rerollAllButton = document.querySelector('#rerollAllButton');
const rerollMembersButton = document.querySelector('#rerollMembersButton');
const rerollTopicsButton = document.querySelector('#rerollTopicsButton');
const exportTextButton = document.querySelector('#exportTextButton');
const exportCsvButton = document.querySelector('#exportCsvButton');
const printButton = document.querySelector('#printButton');
const resetButton = document.querySelector('#resetButton');
const rosterImage = document.querySelector('#rosterImage');
const uploadBox = document.querySelector('#uploadBox');
const ocrStatus = document.querySelector('#ocrStatus');
const tabButtons = [...document.querySelectorAll('.tab-button')];
const pastePanel = document.querySelector('#pastePanel');
const imagePanel = document.querySelector('#imagePanel');

let currentResults = [];
let lastRun = null;
let ocrBusy = false;

function getGroupMode() {
  return document.querySelector('input[name="groupMode"]:checked').value;
}

function readInputs() {
  return {
    names: parseLines(namesInput.value),
    topics: parseLines(topicsInput.value),
    value: Number.parseInt(groupValue.value, 10),
    mode: getGroupMode(),
    allowReuse: allowTopicReuse.checked
  };
}

function updateNameInfo() {
  const names = parseLines(namesInput.value);
  const duplicates = findDuplicateEntries(names);

  nameCount.textContent = `${names.length} ${names.length === 1 ? 'name' : 'names'}`;
  duplicateNotice.hidden = duplicates.length === 0;
  duplicateNotice.textContent = duplicates.length
    ? `Possible duplicate ${duplicates.length === 1 ? 'entry' : 'entries'}: ${duplicates.join(', ')}. Keep them if they are different people with the same name.`
    : '';

  updateGroupPreview();
}

function updateGroupLabel() {
  groupValueLabel.textContent = getGroupMode() === 'groups' ? 'Number of groups' : 'People per group';
  updateGroupPreview();
}

function updateGroupPreview() {
  const { names, mode, value } = readInputs();

  if (!names.length || !Number.isInteger(value) || value < 1) {
    groupPreview.textContent = 'Add names and a group setting to preview the layout.';
    return;
  }

  try {
    const count = getGroupCount(names.length, mode, value);
    const min = Math.floor(names.length / count);
    const max = Math.ceil(names.length / count);
    groupPreview.textContent = min === max
      ? `${count} ${count === 1 ? 'group' : 'groups'} • ${min} ${min === 1 ? 'person' : 'people'} per group`
      : `${count} groups • ${min}–${max} people per group`;
  } catch (error) {
    groupPreview.textContent = error.message;
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.hidden = true;
}

async function flashButton(button, temporaryText) {
  const originalText = button.textContent;
  button.textContent = temporaryText;
  window.setTimeout(() => {
    button.textContent = originalText;
  }, 1200);
}

function createGroupCard(group, index) {
  const card = document.createElement('article');
  card.className = 'group-card';

  const cardHeader = document.createElement('div');
  cardHeader.className = 'group-card-header';

  const titleWrap = document.createElement('div');
  const heading = document.createElement('h3');
  heading.textContent = `Group ${index + 1}`;
  titleWrap.appendChild(heading);

  if (group.topic) {
    const topic = document.createElement('p');
    topic.className = 'group-topic';
    topic.textContent = group.topic;
    titleWrap.appendChild(topic);
  }

  const copyGroupButton = document.createElement('button');
  copyGroupButton.type = 'button';
  copyGroupButton.className = 'mini-button';
  copyGroupButton.textContent = 'Copy';
  copyGroupButton.addEventListener('click', async () => {
    try {
      await copyText(groupToText(group, index));
      await flashButton(copyGroupButton, 'Copied');
    } catch {
      showError('Copy was blocked by the browser. Use Export TXT instead.');
    }
  });

  cardHeader.append(titleWrap, copyGroupButton);
  card.appendChild(cardHeader);

  const list = document.createElement('ul');
  group.members.forEach((member) => {
    const item = document.createElement('li');
    item.textContent = member;
    list.appendChild(item);
  });

  card.appendChild(list);
  return card;
}

function renderResults(groups, { scroll = true } = {}) {
  resultsContainer.replaceChildren(...groups.map(createGroupCard));
  resultsSummary.textContent = summarizeGroups(groups);
  resultsSection.hidden = false;

  if (scroll) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function switchTab(tab) {
  const showPaste = tab === 'paste';
  pastePanel.hidden = !showPaste;
  imagePanel.hidden = showPaste;

  tabButtons.forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function runAll({ scroll = true } = {}) {
  clearError();
  const inputs = readInputs();
  const groups = buildGroups(inputs.names, inputs.mode, inputs.value);
  currentResults = assignTopics(groups, inputs.topics, inputs.allowReuse);
  lastRun = inputs;
  renderResults(currentResults, { scroll });
}

function clearWorkingData() {
  namesInput.value = '';
  topicsInput.value = '';
  groupValue.value = '4';
  document.querySelector('input[name="groupMode"][value="groups"]').checked = true;
  allowTopicReuse.checked = false;
  rosterImage.value = '';
  currentResults = [];
  lastRun = null;
  resultsContainer.replaceChildren();
  resultsSection.hidden = true;
  resultsSummary.textContent = '';
  ocrStatus.textContent = 'Choose a clear photo of a roster. OCR runs only on this device.';
  ocrStatus.classList.remove('status-success');
  clearError();
  updateNameInfo();
  updateGroupLabel();
  switchTab('paste');
  namesInput.focus();
}

async function processImage(file) {
  if (!file || ocrBusy) return;

  clearError();
  ocrBusy = true;
  rosterImage.disabled = true;
  uploadBox.classList.add('is-busy');
  ocrStatus.classList.remove('status-success');

  try {
    const extractedNames = await extractNamesFromImage(file, (status) => {
      ocrStatus.textContent = status;
    });

    namesInput.value = extractedNames.join('\n');
    updateNameInfo();
    ocrStatus.textContent = `${extractedNames.length} ${extractedNames.length === 1 ? 'line' : 'lines'} extracted locally. Review and correct the names below before randomizing.`;
    ocrStatus.classList.add('status-success');
    switchTab('paste');
    namesInput.focus();
  } catch (error) {
    ocrStatus.textContent = error.message;
  } finally {
    rosterImage.value = '';
    rosterImage.disabled = false;
    uploadBox.classList.remove('is-busy');
    ocrBusy = false;
  }
}

namesInput.addEventListener('input', updateNameInfo);
groupValue.addEventListener('input', updateGroupPreview);

document.querySelectorAll('input[name="groupMode"]').forEach((radio) => {
  radio.addEventListener('change', updateGroupLabel);
});

tabButtons.forEach((button) => {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
});

rosterImage.addEventListener('change', () => processImage(rosterImage.files?.[0]));

for (const eventName of ['dragenter', 'dragover']) {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (!ocrBusy) uploadBox.classList.add('drag-active');
  });
}

for (const eventName of ['dragleave', 'drop']) {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.remove('drag-active');
  });
}

uploadBox.addEventListener('drop', (event) => {
  const [file] = event.dataTransfer?.files || [];
  if (file) processImage(file);
});

randomizeButton.addEventListener('click', () => {
  try {
    runAll();
  } catch (error) {
    showError(error.message);
  }
});

rerollAllButton.addEventListener('click', () => {
  try {
    runAll({ scroll: false });
  } catch (error) {
    showError(error.message);
  }
});

rerollMembersButton.addEventListener('click', () => {
  clearError();
  if (!lastRun || !currentResults.length) return;

  try {
    const groups = buildGroups(lastRun.names, lastRun.mode, lastRun.value);
    currentResults = groups.map((members, index) => ({
      members,
      topic: currentResults[index]?.topic || ''
    }));
    renderResults(currentResults, { scroll: false });
  } catch (error) {
    showError(error.message);
  }
});

rerollTopicsButton.addEventListener('click', () => {
  clearError();
  if (!lastRun || !currentResults.length) return;

  try {
    const membersOnly = currentResults.map((group) => [...group.members]);
    currentResults = assignTopics(membersOnly, lastRun.topics, lastRun.allowReuse);
    renderResults(currentResults, { scroll: false });
  } catch (error) {
    showError(error.message);
  }
});

copyButton.addEventListener('click', async () => {
  if (!currentResults.length) return;

  try {
    await copyText(groupsToText(currentResults));
    await flashButton(copyButton, 'Copied');
  } catch {
    showError('Copy was blocked by the browser. Use Export TXT instead.');
  }
});

exportTextButton.addEventListener('click', () => {
  if (!currentResults.length) return;
  downloadText('trurando-groups.txt', groupsToText(currentResults));
});

exportCsvButton.addEventListener('click', () => {
  if (!currentResults.length) return;
  downloadText('trurando-groups.csv', groupsToCsv(currentResults), 'text/csv;charset=utf-8');
});

printButton.addEventListener('click', () => window.print());
resetButton.addEventListener('click', clearWorkingData);

window.addEventListener('pagehide', () => {
  currentResults = [];
  lastRun = null;
});

updateNameInfo();
updateGroupLabel();
switchTab('paste');
