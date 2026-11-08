"use strict";

const passwordInput = document.querySelector("#password-input");
const toggleVisibilityButton = document.querySelector("#toggle-visibility");
const strengthLabel = document.querySelector("#strength-label");
const strengthMeter = document.querySelector("#strength-meter");
const meterFill = document.querySelector("#meter-fill");
const scoreCaption = document.querySelector("#score-caption");
const checkCount = document.querySelector("#check-count");
const checkItems = [...document.querySelectorAll("#check-list li")];
const suggestButton = document.querySelector("#suggest-button");
const regenerateButton = document.querySelector("#regenerate-button");
const suggestions = document.querySelector("#suggestions");
const suggestionList = document.querySelector("#suggestion-list");
const errorMessage = document.querySelector("#error-message");

const commonPasswords = new Set([
  "123456",
  "123456789",
  "12345678",
  "password",
  "password1",
  "qwerty",
  "qwerty123",
  "letmein",
  "welcome",
  "admin",
  "iloveyou",
  "abc123",
]);

const symbols = "!@#$%^&*()-_=+[]{}?";
const passwordAlphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}?";

function hasSequentialPattern(password) {
  const normalized = password.toLowerCase();
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];

  return sequences.some((sequence) => {
    for (let index = 0; index <= sequence.length - 3; index += 1) {
      const fragment = sequence.slice(index, index + 3);
      if (normalized.includes(fragment) || normalized.includes([...fragment].reverse().join(""))) {
        return true;
      }
    }
    return false;
  });
}

function evaluatePassword(password) {
  const length = [...password].length;
  const noCommonPassword = !commonPasswords.has(password.toLowerCase());
  const noRepeatedRun = !/(.)\1{2,}/u.test(password);
  const noSequence = !hasSequentialPattern(password);
  const uniqueRatio = length === 0 ? 0 : new Set([...password]).size / length;

  const checks = {
    length: length >= 12,
    long: length >= 16,
    variety: /[a-z]/u.test(password) && /[A-Z]/u.test(password),
    number: /\d/u.test(password),
    symbol: /[^\p{L}\p{N}\s]/u.test(password),
    unique: length >= 12 && uniqueRatio >= 0.65,
    patterns: noCommonPassword && noRepeatedRun && noSequence,
  };

  if (!password) {
    return {
      score: 0,
      checks: Object.fromEntries(Object.keys(checks).map((key) => [key, false])),
      label: "Waiting for password",
      caption: "Your score is based on length, variety, and patterns.",
    };
  }

  let score = 0;
  if (length >= 8) score += 12;
  if (length >= 12) score += 12;
  if (length >= 16) score += 10;
  if (length >= 20) score += 5;
  if (checks.variety) score += 8;
  if (checks.number) score += 8;
  if (checks.symbol) score += 8;
  score += Math.round(Math.min(uniqueRatio, 0.8) * 20);
  if (noCommonPassword) score += 8;
  if (noRepeatedRun) score += 5;
  if (noSequence) score += 4;
  if (length < 8) score -= 15;
  if (!noCommonPassword) score -= 25;
  if (!noRepeatedRun) score -= 12;
  if (!noSequence) score -= 10;
  score = Math.max(0, Math.min(100, score));

  let label = "Very weak";
  if (score >= 80) label = "Strong";
  else if (score >= 60) label = "Good";
  else if (score >= 35) label = "Fair";
  else if (score >= 20) label = "Weak";

  const caption = checks.patterns
    ? `${score}/100 · Longer, less predictable passwords are harder to guess.`
    : `${score}/100 · A common or predictable pattern makes this easier to guess.`;

  return { score, checks, label, caption };
}

function updateAnalysis() {
  const result = evaluatePassword(passwordInput.value);
  strengthLabel.textContent = result.label;
  strengthMeter.setAttribute("aria-valuenow", String(result.score));
  meterFill.style.width = `${result.score}%`;
  scoreCaption.textContent = result.caption;

  const activeColor = result.score < 35 ? "var(--red)" : result.score < 60 ? "var(--amber)" : "var(--green)";
  meterFill.style.backgroundColor = result.score === 0 ? "var(--green)" : activeColor;
  strengthLabel.style.color = result.score === 0 ? "var(--muted)" : activeColor;

  let passedCount = 0;
  for (const item of checkItems) {
    const passed = result.checks[item.dataset.check];
    item.classList.toggle("passed", passed);
    item.querySelector(".check-icon").textContent = passed ? "✓" : "–";
    if (passed) passedCount += 1;
  }
  checkCount.textContent = `${passedCount} of ${checkItems.length}`;
}

function randomBelow(maximum) {
  const range = 256;
  const limit = range - (range % maximum);
  const value = new Uint8Array(1);
  let byte;
  do {
    crypto.getRandomValues(value);
    byte = value[0];
  } while (byte >= limit);
  return byte % maximum;
}

function generatePassword() {
  const characters = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    symbols,
  ].map((set) => set[randomBelow(set.length)]);

  while (characters.length < 20) {
    characters.push(passwordAlphabet[randomBelow(passwordAlphabet.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomBelow(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join("");
}

function renderSuggestions() {
  errorMessage.hidden = true;
  if (!globalThis.crypto?.getRandomValues) {
    errorMessage.textContent = "Secure password generation is not available in this browser context. Open LUE through HTTPS or localhost and try again.";
    errorMessage.hidden = false;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 3; index += 1) {
    const item = document.createElement("li");
    item.className = "suggestion-item";

    const password = document.createElement("span");
    password.className = "suggestion-password";
    password.textContent = generatePassword();

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.setAttribute("aria-label", `Copy password option ${index + 1}`);
    copyButton.addEventListener("click", () => copySuggestion(password.textContent, copyButton));

    item.append(password, copyButton);
    fragment.append(item);
  }

  suggestionList.replaceChildren(fragment);
  suggestions.hidden = false;
  suggestions.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function copySuggestion(password, button) {
  errorMessage.hidden = true;
  if (!navigator.clipboard?.writeText) {
    errorMessage.textContent = "Clipboard access is unavailable. Select and copy the password instead.";
    errorMessage.hidden = false;
    return;
  }

  try {
    await navigator.clipboard.writeText(password);
    button.textContent = "Copied";
    button.classList.add("copied");
    window.setTimeout(() => {
      button.textContent = "Copy";
      button.classList.remove("copied");
    }, 1400);
  } catch {
    errorMessage.textContent = "Could not copy to the clipboard. Select and copy the password instead.";
    errorMessage.hidden = false;
  }
}

passwordInput.addEventListener("input", updateAnalysis);
toggleVisibilityButton.addEventListener("click", () => {
  const visible = passwordInput.type === "password";
  passwordInput.type = visible ? "text" : "password";
  toggleVisibilityButton.textContent = visible ? "Hide" : "Show";
  toggleVisibilityButton.setAttribute("aria-pressed", String(visible));
});
suggestButton.addEventListener("click", renderSuggestions);
regenerateButton.addEventListener("click", renderSuggestions);

updateAnalysis();
