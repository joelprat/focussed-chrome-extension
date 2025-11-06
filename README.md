# 🧠 Focussed – Stay Productive by Blocking Distracting Websites

**Focussed** is a simple and privacy-friendly Chrome extension that helps you stay concentrated by blocking distracting websites for a chosen period of time.  
You select which URLs to block and until what time, and Focussed will prevent you from visiting them until your focus session ends.

---

## 🚀 Features

-**Focus Timer** – Choose an unlock time to stay distraction-free until you finish your work. -**Custom Website Blocking** – Add or remove websites from your personal block list. -**Lock Mode** – Once “Lock In” is activated, blocked websites remain inaccessible until the set time expires. -**Notifications** – Get a notification when your focus session ends. -**Local Storage Only** – All settings are stored locally using Chrome’s storage API — nothing is uploaded or tracked.

---

## 🛠️ How It Works

1. Open the Focussed popup from your Chrome toolbar.
2. Add the websites you want to block (e.g., `youtube.com`, `twitter.com`).
3. Choose the hour and minute when you want to unlock access.
4. Click **Lock In** to activate your focus session.
5. Focussed will automatically unblock your sites when the timer expires.

---

## 🔐 Permissions Explained

| Permission                      | Purpose                                                              |
| ------------------------------- | -------------------------------------------------------------------- |
| `declarativeNetRequest`         | Temporarily blocks access to chosen websites.                        |
| `declarativeNetRequestFeedback` | Ensures blocking rules are applied and removed correctly.            |
| `storage`                       | Saves your blocked URLs and unlock time locally.                     |
| `alarms`                        | Schedules automatic unblocking at the selected time.                 |
| `notifications`                 | Displays an alert when your focus session ends.                      |
| `host_permissions: <all_urls>`  | Lets users choose any site to block. No content is read or modified. |

---

## 🔒 Privacy

Focussed **does not collect, share, or transmit any user data**.  
All configuration (blocked URLs and timer settings) is stored locally in your browser using Chrome’s `storage.local` API.  
The full source code is open and available for review.
