"use strict";

import getHours from "./utils/getHours.js";
import getHoursBetween from "./utils/getHoursBetween.js";
import getMaxTime from "./utils/getMaxTime.js";
import { defaultBlockedUrls } from "./utils/blockedUrls.js";

let blockedUrls = [...defaultBlockedUrls];

const renderTableCells = () => {
  const blockedUrlsTable = document.getElementById("blockedUrls-table");
  blockedUrlsTable.innerHTML = "";

  blockedUrls.forEach((url, index) => {
    const row = blockedUrlsTable.insertRow();
    const contentCell = row.insertCell();
    const deleteCell = row.insertCell();
    const deleteButton = document.createElement("button");

    contentCell.textContent = url;
    deleteButton.textContent = "X";

    deleteButton.addEventListener("click", () => {
      blockedUrls.splice(index, 1);
      chrome.storage.local.set({ blockedUrls });
      renderTableCells();
    });

    deleteCell.appendChild(deleteButton);
    deleteCell.classList.add("deleteCell");
  });
};

const addNewUrl = () => {
  const input = document.getElementById("newUrl-input");
  const value = input.value.trim();
  if (!value) return;

  blockedUrls.push(value);
  chrome.storage.local.set({ blockedUrls });
  input.value = "";
  renderTableCells();
};

const initTimeSelectors = () => {
  const currentTime = new Date();
  const currentHour = getHours(currentTime);
  const maxHour = getHours(getMaxTime(currentTime));
  const hoursBetween = getHoursBetween(currentHour, maxHour);

  const hoursSelect = document.getElementById("hour-picker");
  ["hh", ...hoursBetween].forEach((hour) =>
    hoursSelect.add(new Option(hour, hour, hour === "hh"))
  );
};

const setupEventListeners = (unlockTimeActive) => {
  const lockInButton = document.getElementById("lockIn-btn");
  const hoursSelect = document.getElementById("hour-picker");
  const minutesSelect = document.getElementById("minutes-picker");
  const lockInLabel = document.getElementById("lockIn-label");
  const addButton = document.getElementById("newUrl-button");

  const changeUiToTimerActive = () => {
    document
      .querySelectorAll(".deleteCell")
      .forEach((button) => (button.style.display = "none"));
    document.getElementById("urls-title").innerText = "Blocked urls";
    document.querySelector("table").style.textAlign = "center";
    lockInButton.style.display = "none";

    hoursSelect.value = unlockTimeActive?.[0] ?? hoursSelect.value;
    hoursSelect.disabled = true;

    minutesSelect.value = unlockTimeActive?.[1] ?? minutesSelect.value;
    minutesSelect.disabled = true;

    addButton.disabled = true;
    document.getElementById("addNewUrl-section").style.display = "none";

    lockInLabel.innerText = "Locked in until";
  };

  if (unlockTimeActive) {
    changeUiToTimerActive();
    return;
  }

  let unlockTime = ["hh", "mm"];

  lockInButton?.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "saveUnlockTime",
      unlockTime,
    });

    chrome.runtime.sendMessage({
      type: "updateBlockedUrls",
      urls: blockedUrls,
    });

    changeUiToTimerActive();
  });

  hoursSelect.addEventListener("change", (event) => {
    unlockTime[0] = event.target.value;
    if (unlockTime[0] !== "hh" && unlockTime[1] !== "mm") {
      lockInButton.disabled = false;
    }
  });

  minutesSelect.addEventListener("change", (event) => {
    unlockTime[1] = event.target.value;
    if (unlockTime[0] !== "hh" && unlockTime[1] !== "mm") {
      lockInButton.disabled = false;
    }
  });

  addButton.addEventListener("click", addNewUrl);
};

const initPopup = () => {
  chrome.storage.local.get(["blockedUrls", "unlockTime"], (result) => {
    if (result.blockedUrls?.length) blockedUrls = [...result.blockedUrls];
    const unlockTimeActive = result.unlockTime;

    initTimeSelectors();
    renderTableCells();
    setupEventListeners(unlockTimeActive);
  });
};

document.addEventListener("DOMContentLoaded", initPopup);
