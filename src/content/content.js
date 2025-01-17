// Create selection icon
const createSelectionIcon = () => {
    const icon = document.createElement('div');
    icon.id = 'fluent-translator-selection-icon';
    icon.innerHTML = `<div class="fluent-translator-translate-icon"></div>`;
    icon.style.display = 'none';
    document.body.appendChild(icon);
    return icon;
};

// Position selection icon
const positionSelectionIcon = (icon, selection) => {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Find the center top point of the selected text
    const centerX = rect.left + (rect.width / 2);

    // Position the icon
    icon.style.left = `${centerX + scrollX}px`;
    icon.style.top = `${rect.top + scrollY}px`;
};

// Make popup draggable
const makeDraggable = (popup) => {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let wasDragged = false;

    const getInitialTransform = () => {
        const style = window.getComputedStyle(popup);
        const matrix = new WebKitCSSMatrix(style.transform);
        return {
            x: matrix.m41,
            y: matrix.m42
        };
    };

    const dragStart = (e) => {
        if (e.target.closest('.fluent-translator-action-btn') || e.target.closest('.fluent-translator-translator-actions')) return;

        const initialTransform = getInitialTransform();
        xOffset = initialTransform.x;
        yOffset = initialTransform.y;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === popup || e.target.closest('.fluent-translator-translator-content')) {
            isDragging = true;
            wasDragged = false;
            popup.style.cursor = 'grabbing';
        }
    };

    const dragEnd = (e) => {
        if (!isDragging) return;
        
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        popup.style.cursor = 'grab';

        // Prevent click event if dragged
        if (wasDragged) {
            e.stopPropagation();
        }
    };

    const drag = (e) => {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;

        wasDragged = true;
        popup.style.transform = `translate(${currentX}px, ${currentY}px)`;
    };

    popup.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Set cursor style
    popup.style.cursor = 'grab';

    // Prevent clicks outside popup
    popup.addEventListener('click', (e) => {
        if (wasDragged) {
            e.stopPropagation();
            wasDragged = false;
        }
    });
};

// Create translation popup
const createTranslationPopup = () => {
    const popup = document.createElement('div');
    popup.id = 'fluent-translator-popup';
    popup.innerHTML = `
        <div class="fluent-translator-action-btn fluent-translator-close-btn" title="${chrome.i18n.getMessage("closeButton")}">
            <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
        </div>
        <div class="fluent-translator-translator-content">
            <div class="fluent-translator-translator-header">
                <div class="fluent-translator-source-text"></div>
                <div class="fluent-translator-translator-actions">
                    <div class="fluent-translator-action-btn copy-source" title="${chrome.i18n.getMessage("copySourceButton")}">
                        <svg class="fluent-translator-copy-icon" width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"/>
                        </svg>
                        <svg class="fluent-translator-check-icon" width="16" height="16" viewBox="0 0 24 24" style="display: none;">
                            <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                        </svg>
                    </div>
                    <div class="fluent-translator-action-btn listen-source" title="${chrome.i18n.getMessage("listenSourceButton")}">
                        <svg class="fluent-translator-play-icon" width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
                        </svg>
                        <svg class="fluent-translator-stop-icon" width="16" height="16" viewBox="0 0 24 24" style="display: none;">
                            <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M9,9H15V15H9"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="fluent-translator-translator-divider">
                <span class="fluent-translator-source-lang" style="margin-right: 8px;"></span>
                <span class="fluent-translator-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M9.6,13.5h2.1v-2H9.6v2m6.3-2h-2.1v2h2.1v-2m-6.3-2h2.1v-2H9.6v2m6.3-2h-2.1v2h2.1v-2M12,3A9,9,0,0,0,3,12a9,9,0,0,0,9,9,9,9,0,0,0,9-9A9,9,0,0,0,12,3Z"/>
                    </svg>
                </span>
                <span class="fluent-translator-target-lang" style="margin-left: 8px;"></span>
            </div>
            <div class="fluent-translator-translator-result">
                <div class="fluent-translator-translated-text"></div>
                <div class="fluent-translator-translator-actions">
                    <div class="fluent-translator-action-btn copy-translation" title="${chrome.i18n.getMessage("copyTranslationButton")}">
                        <svg class="fluent-translator-copy-icon" width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"/>
                        </svg>
                        <svg class="fluent-translator-check-icon" width="16" height="16" viewBox="0 0 24 24" style="display: none;">
                            <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                        </svg>
                    </div>
                    <div class="fluent-translator-action-btn listen-translation" title="${chrome.i18n.getMessage("listenTranslationButton")}">
                        <svg class="fluent-translator-play-icon" width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
                        </svg>
                        <svg class="fluent-translator-stop-icon" width="16" height="16" viewBox="0 0 24 24" style="display: none;">
                            <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M9,9H15V15H9"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `;
    popup.style.display = 'none';
    document.body.appendChild(popup);

    // Make popup draggable
    makeDraggable(popup);

    // Text to speech functionality with language detection
    const speak = (text, lang, button) => {
        // Stop current speech and reset all buttons
        window.speechSynthesis.cancel();
        resetAllPlayButtons();

        // Update icons
        const playIcon = button.querySelector('.fluent-translator-play-icon');
        const stopIcon = button.querySelector('.fluent-translator-stop-icon');
        
        // Start new speech
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Fix language code format
        lang = lang.split('-')[0]; // "en-US" -> "en"
        
        // Check available voices
        const voices = window.speechSynthesis.getVoices();
        const availableVoice = voices.find(voice => 
            voice.lang.toLowerCase().startsWith(lang.toLowerCase())
        );

        // Use voice for language if available
        if (availableVoice) {
            utterance.voice = availableVoice;
            utterance.lang = availableVoice.lang;
        } else {
            utterance.lang = lang;
        }

        // Set speech rate and pitch
        utterance.rate = 0.9; // A bit slower
        utterance.pitch = 1.0; // Normal pitch

        // Reset icons when speech ends
        utterance.onend = () => {
            resetPlayButton(button);
        };

        // Update icons and start speech
        playIcon.style.display = 'none';
        stopIcon.style.display = 'block';
        button.setAttribute('title', button.getAttribute('title').replace('Listen', 'Stop'));
        
        window.speechSynthesis.speak(utterance);
    };

    // Copy text with animation
    const copyText = async (text, button) => {
        await navigator.clipboard.writeText(text);
        
        const copyIcon = button.querySelector('.fluent-translator-copy-icon');
        const checkIcon = button.querySelector('.fluent-translator-check-icon');
        
        copyIcon.style.display = 'none';
        checkIcon.style.display = 'block';
        button.style.color = '#4CAF50';
        
        setTimeout(() => {
            copyIcon.style.display = 'block';
            checkIcon.style.display = 'none';
            button.style.color = '';
        }, 1500);
    };

    // Copy source text
    popup.querySelector('.copy-source').addEventListener('click', (e) => {
        const text = popup.querySelector('.fluent-translator-source-text').textContent;
        copyText(text, e.currentTarget);
    });

    // Copy translation
    popup.querySelector('.copy-translation').addEventListener('click', (e) => {
        const text = popup.querySelector('.fluent-translator-translated-text').textContent;
        copyText(text, e.currentTarget);
    });

    // Listen source text with detected language
    popup.querySelector('.listen-source').addEventListener('click', (e) => {
        const button = e.currentTarget;
        const stopIcon = button.querySelector('.fluent-translator-stop-icon');
        
        // Stop speech if it's playing
        if (stopIcon.style.display === 'block') {
            window.speechSynthesis.cancel();
            resetAllPlayButtons();
            return;
        }

        const text = popup.querySelector('.fluent-translator-source-text').textContent;
        const detectedLang = popup.getAttribute('data-source-lang') || 'en';
        speak(text, detectedLang, button);
    });

    // Listen translation
    popup.querySelector('.listen-translation').addEventListener('click', (e) => {
        const button = e.currentTarget;
        const stopIcon = button.querySelector('.fluent-translator-stop-icon');
        
        // Stop speech if it's playing
        if (stopIcon.style.display === 'block') {
            window.speechSynthesis.cancel();
            resetAllPlayButtons();
            return;
        }

        const text = popup.querySelector('.fluent-translator-translated-text').textContent;
        const targetLang = chrome.i18n.getUILanguage();
        speak(text, targetLang, button);
    });

    // Close button
    popup.querySelector('.fluent-translator-close-btn').addEventListener('click', () => {
        closePopup();
    });

    return popup;
};

// Show tooltip
const showTooltip = (element, text) => {
    element.textContent = text;
    element.style.opacity = '1';
    setTimeout(() => {
        element.style.opacity = '0';
    }, 2000);
};

// Position popup near the selected text
const positionPopup = (popup, selection) => {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Make popup temporarily visible but hidden to calculate its dimensions
    popup.style.visibility = 'hidden';
    popup.style.display = 'block';
    
    // Get popup dimensions
    const popupRect = popup.getBoundingClientRect();
    const popupHeight = popupRect.height;
    const popupWidth = popupRect.width;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate initial center position
    let centerX = rect.left + (rect.width / 2);
    let posY = rect.top;
    
    // Adjust horizontal position if popup would overflow
    if (centerX - (popupWidth / 2) < 0) {
        centerX = popupWidth / 2;
    } else if (centerX + (popupWidth / 2) > viewportWidth) {
        centerX = viewportWidth - (popupWidth / 2);
    }
    
    // Determine whether to show popup above or below selection
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const showAbove = spaceAbove > spaceBelow && spaceAbove > popupHeight;
    
    // Set vertical position
    if (showAbove) {
        popup.style.transform = 'translate(-50%, -100%) translateY(-10px)';
    } else {
        popup.style.transform = 'translate(-50%, 0) translateY(10px)';
        posY = rect.bottom;
    }
    
    // Set final position
    popup.style.left = `${centerX + scrollX}px`;
    popup.style.top = `${posY + scrollY}px`;
    
    // Show popup after positioning
    requestAnimationFrame(() => {
        popup.style.visibility = 'visible';
    });
};

// Get full language name from language code
function getLanguageName(code) {
    const languages = {
        'af': 'Afrikaans',
        'sq': 'Albanian',
        'am': 'Amharic',
        'ar': 'Arabic',
        'hy': 'Armenian',
        'az': 'Azerbaijani',
        'eu': 'Basque',
        'be': 'Belarusian',
        'bn': 'Bengali',
        'bs': 'Bosnian',
        'bg': 'Bulgarian',
        'ca': 'Catalan',
        'ceb': 'Cebuano',
        'ny': 'Chichewa',
        'zh': 'Chinese',
        'zh-CN': 'Chinese (Simplified)',
        'zh-TW': 'Chinese (Traditional)',
        'co': 'Corsican',
        'hr': 'Croatian',
        'cs': 'Czech',
        'da': 'Danish',
        'nl': 'Dutch',
        'en': 'English',
        'eo': 'Esperanto',
        'et': 'Estonian',
        'tl': 'Filipino',
        'fi': 'Finnish',
        'fr': 'French',
        'fy': 'Frisian',
        'gl': 'Galician',
        'ka': 'Georgian',
        'de': 'German',
        'el': 'Greek',
        'gu': 'Gujarati',
        'ht': 'Haitian Creole',
        'ha': 'Hausa',
        'haw': 'Hawaiian',
        'iw': 'Hebrew',
        'hi': 'Hindi',
        'hmn': 'Hmong',
        'hu': 'Hungarian',
        'is': 'Icelandic',
        'ig': 'Igbo',
        'id': 'Indonesian',
        'ga': 'Irish',
        'it': 'Italian',
        'ja': 'Japanese',
        'jw': 'Javanese',
        'kn': 'Kannada',
        'kk': 'Kazakh',
        'km': 'Khmer',
        'ko': 'Korean',
        'ku': 'Kurdish',
        'ky': 'Kyrgyz',
        'lo': 'Lao',
        'la': 'Latin',
        'lv': 'Latvian',
        'lt': 'Lithuanian',
        'lb': 'Luxembourgish',
        'mk': 'Macedonian',
        'mg': 'Malagasy',
        'ms': 'Malay',
        'ml': 'Malayalam',
        'mt': 'Maltese',
        'mi': 'Maori',
        'mr': 'Marathi',
        'mn': 'Mongolian',
        'my': 'Myanmar (Burmese)',
        'ne': 'Nepali',
        'no': 'Norwegian',
        'ps': 'Pashto',
        'fa': 'Persian',
        'pl': 'Polish',
        'pt': 'Portuguese',
        'pa': 'Punjabi',
        'ro': 'Romanian',
        'ru': 'Russian',
        'sm': 'Samoan',
        'gd': 'Scots Gaelic',
        'sr': 'Serbian',
        'st': 'Sesotho',
        'sn': 'Shona',
        'sd': 'Sindhi',
        'si': 'Sinhala',
        'sk': 'Slovak',
        'sl': 'Slovenian',
        'so': 'Somali',
        'es': 'Spanish',
        'su': 'Sundanese',
        'sw': 'Swahili',
        'sv': 'Swedish',
        'tg': 'Tajik',
        'ta': 'Tamil',
        'te': 'Telugu',
        'th': 'Thai',
        'tr': 'Turkish',
        'uk': 'Ukrainian',
        'ur': 'Urdu',
        'uz': 'Uzbek',
        'vi': 'Vietnamese',
        'cy': 'Welsh',
        'xh': 'Xhosa',
        'yi': 'Yiddish',
        'yo': 'Yoruba',
        'zu': 'Zulu'
    };

    if (languages[code] && languages[code].length > 0) {
        return languages[code];
    } else if (code.includes("-")) {
        return getLanguageName(code.split("-")[0]);
    }
    else if (code.includes("_")) {
        return getLanguageName(code.split("_")[0]);
    } else {
        return code;
    }
}

// Translate text using Google Translate API
async function translateText(text, targetLang) {
    try {
        const response = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + targetLang + '&dt=t&q=' + encodeURIComponent(text));
        const data = await response.json();
        
        const translatedText = data[0].map(item => item[0]).join('');
        const detectedLanguage = data[2];
        
        // Update language info in popup with full language names
        var sourceLanguage = chrome.i18n.getMessage("lang" + getLanguageName(detectedLanguage));
        var targetLanguage = chrome.i18n.getMessage("lang" + getLanguageName(targetLang));

        if (sourceLanguage == null || sourceLanguage == undefined || sourceLanguage.length == 0) {
            sourceLanguage = getLanguageName(detectedLanguage);
        }

        if (targetLanguage == null || targetLanguage == undefined || targetLanguage.length == 0) {
            targetLanguage = getLanguageName(detectedLanguage);
        }

        document.querySelector('.fluent-translator-source-lang').textContent = sourceLanguage;
        document.querySelector('.fluent-translator-target-lang').textContent = targetLanguage;
        
        return translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return chrome.i18n.getMessage("translationFailed");
    }
}

// Initialize popup and selection icon
let popup = createTranslationPopup();
let selectionIcon = createSelectionIcon();
let lastSelectedText = '';
let lastSelection = null;
let isTranslating = false;

// Set theme based on received message
const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        if (request.action === "getSelectedText") {
            const selectedText = window.getSelection().toString().trim();
            sendResponse({ text: selectedText });
        } else if (request.action === "setTheme") {
            // Theme handling
            document.documentElement.setAttribute('data-theme', request.theme);
        }
        return true; // Will respond asynchronously
    } catch (error) {
        console.log('Content script error:', error);
        //sendResponse({ error: error.message });
        return true;
    }
});

// Request initial theme
chrome.runtime.sendMessage({ action: "getTheme" }, (response) => {
    if (response && response.theme) {
        setTheme(response.theme);
    }
});

// Close popup and cleanup
const closePopup = () => {
    popup.style.display = 'none';
    window.speechSynthesis.cancel();
    resetAllPlayButtons();
    selectionIcon.style.display = 'none';
};

// Reset single play button
const resetPlayButton = (button) => {
    const playIcon = button.querySelector('.fluent-translator-play-icon');
    const stopIcon = button.querySelector('.fluent-translator-stop-icon');
    if (playIcon && stopIcon) {
        playIcon.style.display = 'block';
        stopIcon.style.display = 'none';
        button.setAttribute('title', button.getAttribute('title').replace('Stop', 'Listen'));
    }
};

// Reset all play buttons
const resetAllPlayButtons = () => {
    const buttons = popup.querySelectorAll('.listen-source, .listen-translation');
    buttons.forEach(resetPlayButton);
};

// Handle text selection
document.addEventListener('mouseup', async (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Close popup when clicking outside
    if (!popup.contains(e.target) && !selectionIcon.contains(e.target) && popup.style.display === 'block' && !e.defaultPrevented) {
        closePopup();
    }

    // Show icon if text is selected and not inside popup
    if (selectedText && !isTranslating && !popup.contains(e.target)) {
        lastSelectedText = selectedText;
        lastSelection = {
            range: selection.getRangeAt(0).cloneRange(),
            rect: selection.getRangeAt(0).getBoundingClientRect()
        };
        selectionIcon.style.display = 'block';
        positionSelectionIcon(selectionIcon, selection);
    } else if (!selectedText && !popup.contains(e.target)) {
        selectionIcon.style.display = 'none';
    }
});

// Listen for escape key to close popup
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.style.display === 'block') {
        closePopup();
    }
});

// Hide selection icon when clicking outside
document.addEventListener('mousedown', (e) => {
    if (!selectionIcon.contains(e.target) && !popup.contains(e.target)) {
        closePopup();
    }
});

// Handle selection icon click
selectionIcon.addEventListener('click', async () => {
    if (!lastSelectedText || isTranslating || !lastSelection) return;
    
    try {
        isTranslating = true;
        // Hide icon
        selectionIcon.style.display = 'none';
        popup.style.display = 'none';

        popup.querySelector('.fluent-translator-source-text').textContent = lastSelectedText;
            
        // Position popup based on last selection
        const fakeSelection = {
            getRangeAt: () => ({
                getBoundingClientRect: () => lastSelection.rect
            }),
            rangeCount: 1
        };
        positionPopup(popup, fakeSelection);
        
        // Then perform translation
        const translatedText = await translateText(lastSelectedText, chrome.i18n.getUILanguage());
        popup.querySelector('.fluent-translator-translated-text').textContent = translatedText;
    } catch (error) {
        console.log('Translation error:', error);
        closePopup();
    } finally {
        isTranslating = false;
    }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'translate') {
        try {
            isTranslating = true;
            selectionIcon.style.display = 'none';
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                popup.querySelector('.fluent-translator-source-text').textContent = request.text;
                
                // Position popup
                positionPopup(popup, selection);
                
                // Then perform translation
                const translatedText = await translateText(request.text, request.targetLang);
                popup.querySelector('.fluent-translator-translated-text').textContent = translatedText;
            }
        } catch (error) {
            console.log('Translation error:', error);
            popup.style.display = 'none';
        } finally {
            isTranslating = false;
        }
    }
    return true;
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelectedText") {
        const selectedText = window.getSelection().toString().trim();
        sendResponse({text: selectedText});
        return true;
    }
});