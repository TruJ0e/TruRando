import { assignTopics, buildGroups, parseLines } from './randomizer.js';
import { copyText, downloadText, groupsToCsv, groupsToText } from './export.js';
import { extractNamesFromImage } from './ocr.js';

const namesInput = document.querySelector('#names');
const topicsInput = document.querySelector('#topics');
const nameCount = document.querySelector('#nameCount');
const groupValue = document.querySelector('#groupValue');
const groupValueLabel = document.querySelector('#groupValueLabel');
const allowTopicReuse = document.querySelector('#allowTopicReuse');
const randomizeButton = document.querySelector('#randomizeButton');
const resultsSection = document.querySelector('#resultsSection');
const resultsContainer = document.querySelector('#results');
const errorMessage = document.querySelector('#errorMessage');
const copyButton = document.querySelector('#copyButton');
const exportTextButton = document.querySelector('#exportTextButton');
const exportCsvButton = document.querySelector('#exportCsvButton');
const resetButton = document.querySelector('#resetButton');
const rosterImage = document.querySelector('#rosterImage');
const ocrStatus = document.querySelector('#ocrStatus');
const tabButtons = [...document.querySelectorAll('.tab-button')];
const pastePanel = document.querySelector('#pastePanel');
const imagePanel = document.querySelector('#imagePanel');

let currentResults = [];

function getGroupMode() {
  return document.querySelector('input[name="groupMode"]:checked').value;
}

function updateNameCount() {
  const count = parseLines(namesInput.value).length;
  nameCount.textContent = `${count} ${count === 1 ? 'name' : 'names'}`;
}

function updateGroupLabel() {
  const mode = getGroupMode();
  groupValueLabel.textContent = mode === 'groups' ? 'Number of groups' : 'People per group';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.hidden = true;
}

function renderResults(groups) {
  resultsContainer.replaceChildren();

  groups.forEach((group, index) => {
    const card = document.createElement('article');
    card.className = 'group-card';

    const heading = document.createElement('h3');
    heading.textContent = `Group ${index + 1}`;
    card.appendChild(heading);

    if (group.topic) {
      const topic = document.createElement('p');
      topic.className = 'group-topic';
      topic.textContent = group.topic;
      card.appendChild(topic);
    }

    const list = document.createElement('ul');
    group.members.forEach((member) => {
      const item = document.createElement('li');
      item.textContent = member;
      list.appendChild(item);
    });

    card.appendChild(list);
    resultsContainer.appendChild(card);
  });

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function switchTab(tab) {
  const showPaste = tab === 'paste';

  pastePanel.hidden = !showPaste;
  imagePanel.hidden = showPaste;

  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
}

function clearWorkingData() {
  namesInput.value = '';
  topicsInput.value = '';
  groupValue.value = '4';
  allowTopicReuse.checked = false;
  rosterImage.value = '';
  currentResults = [];
  resultsContainer.replaceChildren();
  resultsSection.hidden = true;
  ocrStatus.textContent = 'Local OCR is scaffolded but not enabled yet.';
  clearError();
  updateNameCount();
  switchTab('paste');
}

namesInput.addEventListener('input', updateNameCount);

document.querySelectorAll('input[name="groupMode"]').forEach((radio) => {
  radio.addEventListener('change', updateGroupLabel);
});

tabButtons.forEach((button) => {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
});

rosterImage.addEventListener('change', async () => {
  const [file] = rosterImage.files;
  if (!file) return;

  ocrStatus.textContent = 'Reading image locally…';

  try {
    const extractedNames = await extractNamesFromImage(file);
    namesInput.value = extractedNames.join('\n');
    updateNameCount();
    ocrStatus.textContent = `${extractedNames.length} names extracted. Review them before randomizing.`;
    switchTab('paste');
  } catch (error) {
    ocrStatus.textContent = error.message;
  }
});

randomizeButton.addEventListener('click', () => {
  clearError();

  try {
    const names = parseLines(namesInput.value);
    const topics = parseLines(topicsInput.value);
    const value = Number.parseInt(groupValue.value, 10);
    const mode = getGroupMode();
    const groups = buildGroups(names, mode, value);

    currentResults = assignTopics(groups, topics, allowTopicReuse.checked);
    renderResults(currentResults);
  } catch (error) {
    showError(error.message);
  }
});

copyButton.addEventListener('click', async () => {
  if (!currentResults.length) return;

  try {
    await copyText(groupsToText(currentResults));
    const originalText = copyButton.textContent;
    copyButton.textContent = 'Copied';
    window.setTimeout(() => {
      copyButton.textContent = originalText;
    }, 1200);
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

resetButton.addEventListener('click', clearWorkingData);

window.addEventListener('pagehide', () => {
  currentResults = [];
});

updateNameCount();
updateGroupLabel();
