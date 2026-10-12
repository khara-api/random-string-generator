// 拡張機能のアイコンがクリックされたら、生成ページを新しいタブで開く
// すでに開いているタブがあればそれをアクティブにする
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("generator.html");
  const tabs = await chrome.tabs.query({ url });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});
