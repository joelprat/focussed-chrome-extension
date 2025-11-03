"use strict";

let blockedUrls = [];

const programUnlockTimer = () => {
  chrome.storage.local.get("unlockTime", ({ unlockTime }) => {
    if (!unlockTime) return;

    const now = new Date();
    const target = new Date();
    target.setHours(parseInt(unlockTime[0]));
    target.setMinutes(parseInt(unlockTime[1]));
    target.setSeconds(0);
    target.setMilliseconds(0);

    const timeToWait = target.getTime() - now.getTime();
    if (timeToWait <= 0) return;

    chrome.alarms.create("unlockAlarm", { when: Date.now() + timeToWait });

    console.log(
      `[LockIn] Webs bloqueadas hasta ${target.toLocaleTimeString()} (${Math.round(
        timeToWait / 60000
      )} min)`
    );
  });
};

const clearBlockedRules = () => {
  chrome.declarativeNetRequest.getDynamicRules((oldRules) => {
    const oldIds = oldRules.map((r) => r.id);
    if (oldIds.length > 0) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldIds,
      });
      console.log("[LockIn] Reglas eliminadas, webs desbloqueadas ✅");

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

const updateBlockedUrls = (urls) => {
  blockedUrls = urls;

  const rules = blockedUrls.map((url, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "block" },
    condition: { urlFilter: url, resourceTypes: ["main_frame"] },
  }));

  chrome.declarativeNetRequest.getDynamicRules((oldRules) => {
    const oldIds = oldRules.map((r) => r.id);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldIds,
      addRules: rules,
    });
    console.log(`[LockIn] ${urls.length} blocked webs  🔒`);
  });
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "updateBlockedUrls") {
    const urlsToBlock = message.urls.map((url) => `||${url}^`);
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

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "unlockAlarm") {
    clearBlockedRules();
    chrome.storage.local.remove("unlockTime");
  }
});
