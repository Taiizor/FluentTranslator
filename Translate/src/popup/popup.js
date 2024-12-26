tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'dark': '#1a1d20',
                'darker': '#141618',
                'light': '#e9ecef',
                'primary': '#3b82f6'
            }
        }
    }
}

// Localization function
function localizeHtmlPage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                element.placeholder = message;
            } else {
                element.textContent = message;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize localization
    localizeHtmlPage();

    const sourceText = document.getElementById('sourceText');
    const translatedText = document.getElementById('translatedText');
    const translateBtn = document.getElementById('translateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const sourceLanguage = document.getElementById('sourceLanguage');
    const targetLanguage = document.getElementById('targetLanguage');
    const swapLanguages = document.getElementById('swapLanguages');
    const themeSwitch = document.getElementById('theme-switch');

    // Check for selected text when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "getSelectedText"}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Content script connection error:', chrome.runtime.lastError);
                    return;
                }
                if (response && response.text) {
                    sourceText.value = response.text;
                    translate();
                }
            });
        }
    });

    // Theme handling
    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            themeSwitch.checked = true;
            document.querySelector('.dot').classList.add('translate-x-6');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            themeSwitch.checked = false;
            document.querySelector('.dot').classList.remove('translate-x-6');
        }
        
        const theme = isDark ? 'dark' : 'light';
        
        // Save theme to chrome.storage
        chrome.storage.local.set({ theme: theme }, () => {
            // Broadcast theme change to all tabs
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "setTheme",
                        theme: theme
                    });
                });
            });
        });
    };

    // Initialize theme based on chrome.storage
    chrome.storage.local.get(['theme'], function(result) {
        setTheme(result.theme === 'dark');
    });

    // Theme switch click handler
    themeSwitch.addEventListener('change', (e) => {
        setTheme(e.target.checked);
    });

    // Populate language dropdowns
    const populateLanguages = () => {
        const languages = getLanguages(); // from languages.js
        const browserLang = navigator.language.split('-')[0];
        
        languages.forEach(lang => {
            const sourceOption = new Option(lang.name, lang.code);
            const targetOption = new Option(lang.name, lang.code);
            
            sourceLanguage.add(sourceOption);
            targetLanguage.add(targetOption);
        });

        // Set default languages
        sourceLanguage.value = 'auto';
        targetLanguage.value = browserLang;
    };

    populateLanguages();

    // Translation function
    const translate = async () => {
        const text = sourceText.value;
        if (!text) return;

        translateBtn.disabled = true;
        translatedText.textContent = chrome.i18n.getMessage("translating");

        try {
            const response = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + 
                sourceLanguage.value + '&tl=' + targetLanguage.value + '&dt=t&q=' + encodeURIComponent(text));
            
            const data = await response.json();
            const translatedContent = data[0].map(item => item[0]).join('');
            translatedText.textContent = translatedContent;
        } catch (error) {
            translatedText.textContent = chrome.i18n.getMessage("translationFailed");
        } finally {
            translateBtn.disabled = false;
        }
    };

    // Event listeners
    translateBtn.addEventListener('click', translate);

    sourceText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            translate();
        }
    });

    copyBtn.addEventListener('click', () => {
        const text = translatedText.textContent;
        if (text) {
            navigator.clipboard.writeText(text);
            copyBtn.textContent = chrome.i18n.getMessage("copied");
            setTimeout(() => {
                copyBtn.textContent = chrome.i18n.getMessage("copyButton");
            }, 2000);
        }
    });

    swapLanguages.addEventListener('click', () => {
        if (translatedText.textContent !== chrome.i18n.getMessage("translating")) {
            if (sourceLanguage.value === 'auto') {
                sourceLanguage.value = targetLanguage.value;
                targetLanguage.value = 'auto';
            } else {
                const temp = sourceLanguage.value;
                sourceLanguage.value = targetLanguage.value;
                targetLanguage.value = temp;
            }

            if (targetLanguage.value === 'auto')
            {
                targetLanguage.value = chrome.i18n.getUILanguage();
            }

            const tempText = sourceText.value;
            sourceText.value = translatedText.textContent;
            translatedText.textContent = tempText;
        }
    });
});