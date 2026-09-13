/**
 * Background Service Worker for Chrome Extension
 * Gestiona pestañas, resuelve la API de Fish Audio y guarda en disco duro
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Fish Audio Voice Vault instalado correctamente.');
});

// Listener para mensajes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'open_tab') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('index.html')
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'resolve_fish_audio') {
    fetch(`https://api.fish.audio/model/${request.modelId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
