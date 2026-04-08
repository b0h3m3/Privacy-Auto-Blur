const DEFAULT_SETTINGS = {
  enabled: true,
  caseSensitive: false,
  blurInputs: true,
  entries: []
};

const form = document.getElementById("settingsForm");
const enabledInput = document.getElementById("enabled");
const blurInputsInput = document.getElementById("blurInputs");
const caseSensitiveInput = document.getElementById("caseSensitive");
const entriesInput = document.getElementById("entries");
const saveMessage = document.getElementById("saveMessage");

function normalizeEntries(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function showMessage(message) {
  saveMessage.textContent = message;
  window.clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = window.setTimeout(() => {
    saveMessage.textContent = "";
  }, 2500);
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  enabledInput.checked = settings.enabled;
  blurInputsInput.checked = settings.blurInputs;
  caseSensitiveInput.checked = settings.caseSensitive;
  entriesInput.value = settings.entries.join("\n");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const settings = {
    enabled: enabledInput.checked,
    blurInputs: blurInputsInput.checked,
    caseSensitive: caseSensitiveInput.checked,
    entries: normalizeEntries(entriesInput.value)
  };

  chrome.storage.sync.set(settings, () => {
    showMessage(`저장 완료: ${settings.entries.length}개 항목`);
  });
});
