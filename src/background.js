"use strict";

let blockedUrls = [];

/**
 * Schedules the unlock timer based on the stored unlock time.
 * If the selected time has already passed today, schedule it for the next day.
 */
const programUnlockTimer = () => {
  chrome.storage.local.get("unlockTime", ({ unlockTime }) => {
    if (!unlockTime) return;

    const now = new Date();
    const target = new Date();
    target.setHours(parseInt(unlockTime[0]));
    target.setMinutes(parseInt(unlockTime[1]));
    target.setSeconds(0);
    target.setMilliseconds(0);

    /**
     * Assuming that if we get to this point and the target hour is smaller
     * than now, means it's for next day. (We are checking these conditions in setup.js)
     */
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const timeToWait = target.getTime() - now.getTime();
    if (timeToWait <= 0) {
      console.warn("[LockIn] Unblock time invalid or passed.");
      return;
    }

    chrome.alarms.create("unlockAlarm", { when: Date.now() + timeToWait });
    chrome.storage.local.set({ unlockTimestamp: target.getTime() });

    console.log(
      `[LockIn] Webs bloqueadas hasta ${target.toLocaleTimeString()} (${Math.round(
        timeToWait / 60000
      )} min)`
    );
  });
};

/**
 * Removes all active blocking rules and notifies the user.
 */
const clearBlockedRules = () => {
  chrome.declarativeNetRequest.getDynamicRules((oldRules) => {
    const oldIds = oldRules.map((r) => r.id);
    if (oldIds.length > 0) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldIds,
      });
      console.log("[LockIn] Rules removed, websites unlocked.");

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon150.png",
        title: "Focussed",
        message: "🔓 You can use again your blocked urls",
        priority: 2,
      });
    }
  });
};

/**
 * Updates the blocking rules with the new list of URLs.
 */
const updateBlockedUrls = (urls) => {
  blockedUrls = urls;

  const rules = blockedUrls.map((url, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: url,
      resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest"],
    },
  }));

  chrome.declarativeNetRequest.getDynamicRules((oldRules) => {
    const oldIds = oldRules.map((r) => r.id);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldIds,
      addRules: rules,
    });
    console.log(`[LockIn] ${urls.length} websites blocked.`);
  });
};

/**
 * Listens for messages sent from the popup.
 */
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "updateBlockedUrls") {
    const urlsToBlock = message.urls.map((url) => {
      let clean = url
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "");

      return `*://*.${clean}/*`;
    });
    updateBlockedUrls(urlsToBlock);
    chrome.storage.local.set({
      unlockTime: message.unlockTime,
      blockedUrls: message.urls,
    });
    programUnlockTimer();
  }

  if (message.type === "saveUnlockTime") {
    chrome.storage.local.set({ unlockTime: message.unlockTime });
  }

  return true;
});

/**
 * Triggered when the unlock alarm fires — removes the rules.
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "unlockAlarm") {
    clearBlockedRules();
    chrome.storage.local.remove(["unlockTime", "unlockTimestamp"]);
  }
});

/**
 * When the browser starts, reprogram the alarm or unlock immediately
 * depending on whether the unlock time has already passed.
 */
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["unlockTimestamp"], ({ unlockTimestamp }) => {
    if (unlockTimestamp && Date.now() >= unlockTimestamp) {
      // Unlock immediately if the unlock time has already passed
      clearBlockedRules();
      chrome.storage.local.remove(["unlockTime", "unlockTimestamp"]);
    } else if (unlockTimestamp) {
      // Recreate the unlock alarm if the time hasn't passed yet
      const timeToWait = unlockTimestamp - Date.now();
      chrome.alarms.create("unlockAlarm", { when: Date.now() + timeToWait });
      console.log(
        `[LockIn] Unlock rescheduled (${Math.round(
          timeToWait / 60000
        )} min remaining)`
      );
    }
  });
});
