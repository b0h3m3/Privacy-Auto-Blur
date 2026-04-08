const DEFAULT_SETTINGS = {
  enabled: true,
  caseSensitive: false,
  blurInputs: true,
  entries: []
};

const statusText = document.getElementById("statusText");
const openOptionsButton = document.getElementById("openOptionsButton");

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  const count = settings.entries.filter(Boolean).length;
  const enabledText = settings.enabled ? "보호 켜짐" : "보호 꺼짐";
  statusText.textContent = `${enabledText} · ${count}개 항목 저장됨`;
});

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
