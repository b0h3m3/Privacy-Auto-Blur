const DEFAULT_SETTINGS = {
  enabled: true,
  caseSensitive: false,
  blurInputs: true,
  entries: []
};

const BLUR_CLASS = "pab-blurred";
const SCAN_SELECTOR = "body";
const EXCLUDED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "SVG", "CANVAS"]);

let activeSettings = { ...DEFAULT_SETTINGS };
let observer = null;
let activeMatcher = null;
let pendingScan = false;
let pendingRoots = new Set();

function clearAllBlur() {
  document.querySelectorAll(`.${BLUR_CLASS}`).forEach((element) => {
    element.classList.remove(BLUR_CLASS);
    delete element.dataset.pabBlurred;
  });
}

function updateMatcher() {
  activeMatcher = buildMatcher(activeSettings.entries, activeSettings.caseSensitive);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatcher(entries, caseSensitive) {
  if (!entries.length) {
    return null;
  }

  const escapedEntries = entries
    .map((entry) => entry.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp);

  if (!escapedEntries.length) {
    return null;
  }

  return new RegExp(escapedEntries.join("|"), caseSensitive ? "g" : "gi");
}

function shouldSkipElement(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return true;
  }

  if (element.closest("[data-pab-ignore='true']")) {
    return true;
  }

  return EXCLUDED_TAGS.has(element.tagName);
}

function shouldBlurText(text, matcher) {
  if (!matcher || !text) {
    return false;
  }

  matcher.lastIndex = 0;
  return matcher.test(text);
}

function applyBlur(element, shouldBlur) {
  if (!element || shouldSkipElement(element)) {
    return;
  }

  if (shouldBlur) {
    element.classList.add(BLUR_CLASS);
    element.dataset.pabBlurred = "true";
  } else if (element.dataset.pabBlurred === "true") {
    element.classList.remove(BLUR_CLASS);
    delete element.dataset.pabBlurred;
  }
}

function inspectInputElement(element, matcher) {
  if (!activeSettings.blurInputs) {
    return;
  }

  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    return;
  }

  const value = element.value || element.placeholder || "";
  applyBlur(element, shouldBlurText(value, matcher));
}

function inspectTextNodes(root, matcher) {
  if (!root || shouldSkipElement(root)) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || shouldSkipElement(parent)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (!node.textContent || !node.textContent.trim()) {
        return NodeFilter.FILTER_SKIP;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const visitedElements = new Set();

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const parent = textNode.parentElement;

    if (!parent || visitedElements.has(parent)) {
      continue;
    }

    visitedElements.add(parent);
    applyBlur(parent, shouldBlurText(parent.innerText || textNode.textContent, matcher));
  }
}

function inspectInputs(root, matcher) {
  if (root instanceof HTMLInputElement || root instanceof HTMLTextAreaElement) {
    inspectInputElement(root, matcher);
  }

  if (!activeSettings.blurInputs || !root.querySelectorAll) {
    return;
  }

  const inputs = root.querySelectorAll("input, textarea");
  inputs.forEach((element) => inspectInputElement(element, matcher));
}

function scanDocument(root = document.querySelector(SCAN_SELECTOR)) {
  if (!activeSettings.enabled) {
    clearAllBlur();
    return;
  }

  if (!activeMatcher || !root) {
    clearAllBlur();
    return;
  }

  inspectTextNodes(root, activeMatcher);
  inspectInputs(root, activeMatcher);
}

function scheduleScan(root) {
  if (root && root.nodeType === Node.TEXT_NODE && root.parentElement) {
    pendingRoots.add(root.parentElement);
  } else if (root && root.nodeType === Node.ELEMENT_NODE) {
    pendingRoots.add(root);
  } else {
    pendingRoots.add(document.body);
  }

  if (pendingScan) {
    return;
  }

  pendingScan = true;
  window.setTimeout(() => {
    pendingScan = false;
    const rootsToScan = Array.from(pendingRoots);
    pendingRoots.clear();

    if (!rootsToScan.length) {
      scanDocument(document.body);
      return;
    }

    rootsToScan.forEach((scanRoot) => scanDocument(scanRoot));
  }, 0);
}

function attachInputListeners() {
  document.addEventListener(
    "input",
    (event) => {
      inspectInputElement(event.target, activeMatcher);
    },
    true
  );
}

function observeDocument() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData" && mutation.target.parentElement) {
        scheduleScan(mutation.target);
        continue;
      }

      mutation.addedNodes.forEach((node) => {
        scheduleScan(node);
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function refreshSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    activeSettings = {
      enabled: settings.enabled,
      caseSensitive: settings.caseSensitive,
      blurInputs: settings.blurInputs,
      entries: settings.entries.filter(Boolean)
    };

    updateMatcher();
    scheduleScan(document.body);
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  if (changes.enabled || changes.caseSensitive || changes.blurInputs || changes.entries) {
    refreshSettings();
  }
});

attachInputListeners();
observeDocument();
refreshSettings();
