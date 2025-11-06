"use strict";

import getHours from "./utils/getHours.js";
import getHoursBetween from "./utils/getHoursBetween.js";
import getMaxTime from "./utils/getMaxTime.js";
import { defaultBlockedUrls } from "./utils/blockedUrls.js";

let blockedUrls = [...defaultBlockedUrls];

/**
 * Checks whether the selected time is still in the future.
 * Handles the special case where the user selects 00:xx after 23:xx.
 */
const isFutureTime = (selectedHour, selectedMinute) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let selected = selectedHour * 60 + selectedMinute;
  const current = currentHour * 60 + currentMinute;

  // Edge case for post-midnight locks (e.g., 23:00 → 00:15)
  console.log(selectedHour, now.getHours());
  if (selected <= current && selectedHour === 0 && now.getHours() <= 23) {
    selected += 24 * 60;
  }

  return selected > current;
};

/**
 * Enables or disables the "Lock In" button depending on whether:
 * - A valid future time is selected
 * - There is at least one URL in the block list
 */
const updateLockInButtonState = (unlockTime, blockedUrls) => {
  const lockInButton = document.getElementById("lockIn-btn");

  const hasValidTime =
    unlockTime[0] !== "hh" &&
    unlockTime[1] !== "mm" &&
    isFutureTime(Number(unlockTime[0]), Number(unlockTime[1]));

  const hasUrls = blockedUrls.length > 0;

  const shouldEnable = hasValidTime && hasUrls;

  lockInButton.disabled = !shouldEnable;
};

/**
 * Renders the list of blocked URLs as rows in the table,
 * including "X" buttons to delete each one.
 */
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

    // Delete the selected URL and update both UI and storage
    deleteButton.addEventListener("click", () => {
      blockedUrls.splice(index, 1);
      chrome.storage.local.set({ blockedUrls });
      renderTableCells();

      const hourPicker = document.getElementById("hour-picker");
      const minutePicker = document.getElementById("minutes-picker");
      updateLockInButtonState(
        [hourPicker.value, minutePicker.value],
        blockedUrls
      );
    });

    deleteCell.appendChild(deleteButton);
    deleteCell.classList.add("deleteCell");
  });
};

/**
 * Adds a new URL to the block list from the input field,
 * then re-renders the table and updates the button state.
 */
const addNewUrl = () => {
  const input = document.getElementById("newUrl-input");
  const value = input.value.trim();
  if (!value) return;

  blockedUrls.push(value);
  chrome.storage.local.set({ blockedUrls });
  input.value = "";
  renderTableCells();

  const hourPicker = document.getElementById("hour-picker");
  const minutePicker = document.getElementById("minutes-picker");
  updateLockInButtonState([hourPicker.value, minutePicker.value], blockedUrls);
};

/**
 * Initializes the hour picker dropdown,
 * showing only valid hours between the current time and the max allowed time.
 */
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

/**
 * Sets up event listeners for UI elements:
 * - "Lock In" button
 * - Hour/minute dropdowns
 * - Add URL button
 * Handles both the active lock state and unlocked state.
 */
const setupEventListeners = (unlockTimeActive) => {
  const lockInButton = document.getElementById("lockIn-btn");
  const hoursSelect = document.getElementById("hour-picker");
  const minutesSelect = document.getElementById("minutes-picker");
  const lockInLabel = document.getElementById("lockIn-label");
  const addButton = document.getElementById("newUrl-button");

  /**
   * Updates the UI once the timer is active.
   * Disables inputs, hides buttons, etc.
   */
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

  // If an active lock exists, load the locked UI immediately
  if (unlockTimeActive) {
    changeUiToTimerActive();
    return;
  }

  let unlockTime = ["hh", "mm"];

  // Handle Lock In button click: save settings and activate lock
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

  // Update the button state when hour or minute is changed
  hoursSelect.addEventListener("change", (event) => {
    unlockTime[0] = event.target.value;
    updateLockInButtonState(unlockTime, blockedUrls);
  });

  minutesSelect.addEventListener("change", (event) => {
    unlockTime[1] = event.target.value;
    updateLockInButtonState(unlockTime, blockedUrls);
  });

  // Add new URL when clicking "Add"
  addButton.addEventListener("click", addNewUrl);
};

/**
 * Initializes the popup when opened.
 * Loads data from storage, sets up the UI, and initializes listeners.
 */
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
