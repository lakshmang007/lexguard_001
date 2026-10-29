// Opens the side panel from the toolbar icon or the right-click menu.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.contextMenus.create({ id: "lexguard-check", title: "Check with LEXGUARD", contexts: ["selection"] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "lexguard-check" || !tab) return;
  // open() must run inside the click gesture, so it is not awaited after other work.
  chrome.sidePanel.open({ tabId: tab.id });
  chrome.storage.session.set({ pending: { tabId: tab.id, at: Date.now() } });
});
