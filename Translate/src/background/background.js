// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'translate-selection',
        title: chrome.i18n.getMessage('contextMenuTranslate'),
        contexts: ['selection']
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'translate-selection' && tab && tab.id) {
        try {
            const browserLang = chrome.i18n.getUILanguage();
            chrome.tabs.sendMessage(tab.id, {
                action: 'translate',
                text: info.selectionText,
                targetLang: browserLang
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Message sending error:', chrome.runtime.lastError);
                }
            });
        } catch (error) {
            console.log('Context menu processing error:', error);
        }
    }
});

// Combine message listeners into one
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        switch (request.action) {
            case 'getUILanguage':
                sendResponse({ language: chrome.i18n.getUILanguage() });
                break;

            case 'getTheme':
                chrome.storage.local.get(['theme'], function(result) {
                    if (chrome.runtime.lastError) {
                        //sendResponse({ error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse({ theme: result.theme || 'light' });
                    }
                });
                return true;

            case 'setTheme':
                chrome.storage.local.set({ theme: request.theme }, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Theme save error:', chrome.runtime.lastError);
                        return;
                    }
                    
                    // Broadcast theme change to all tabs
                    chrome.tabs.query({}, function(tabs) {
                        tabs.forEach(tab => {
                            if (tab.id) {
                                chrome.tabs.sendMessage(tab.id, {
                                    action: "setTheme",
                                    theme: request.theme
                                }, () => {
                                    if (chrome.runtime.lastError) {
                                        console.log(`Theme update error for tab ${tab.id}:`, chrome.runtime.lastError);
                                    }
                                });
                            }
                        });
                    });
                });
                break;
        }
    } catch (error) {
        console.log('Message processing error:', error);
        //sendResponse({ error: error.message });
    }
    return true;
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tabId) {
        chrome.storage.local.get(['theme'], function(result) {
            if (chrome.runtime.lastError) {
                console.log('Theme read error:', chrome.runtime.lastError);
                return;
            }
            
            chrome.tabs.sendMessage(tabId, {
                action: "setTheme",
                theme: result.theme || 'light'
            }, () => {
                if (chrome.runtime.lastError) {
                    console.log(`Theme update error for tab ${tabId}:`, chrome.runtime.lastError);
                }
            });
        });
    }
});