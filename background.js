// Background service worker for Trello Card Creator extension
// Handles Trello API calls and communication with popup

// Single message listener to handle all actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getBoards':
            getBoards(request.key, request.token).then(sendResponse);
            break;
        case 'getLists':
            getLists(request.boardId, request.key, request.token).then(sendResponse);
            break;
        case 'createCard':
            createCard(request.title, request.description, request.listId, request.key, request.token).then(sendResponse);
            break;
        case 'validateCredentials':
            validateCredentials(request.key, request.token).then(sendResponse);
            break;
        case 'openPopup':
            // Try to open popup, but this may not work from all contexts
            try {
                chrome.action.openPopup();
                sendResponse({ success: true });
            } catch (error) {
                sendResponse({ success: false, error: 'Cannot open popup from this context' });
            }
            break;
        case 'cardCreated':
            setBadgeText('✓', '#00875a');
            clearBadge();
            sendResponse({ success: true });
            break;
        default:
            sendResponse({ success: false, error: 'Unknown action' });
            break;
    }
    return true; // Keep message channel open for async response
});

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Open options page on first install
        chrome.runtime.openOptionsPage();
    }
    
    // Create context menu (only if API is available)
    if (chrome.contextMenus) {
        chrome.contextMenus.create({
            id: 'createTrelloCard',
            title: 'Create Trello Card',
            contexts: ['page', 'selection']
        });
    }
});

// Context menu click handler (only if API is available)
if (chrome.contextMenus) {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === 'createTrelloCard') {
            // Since we can't open popup from context menu, we'll inject a script
            // to show a notification and prompt user to click the extension icon
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: showNotification,
                    args: [info.selectionText || '']
                });
            } catch (error) {
                console.log('Could not inject script, falling back to badge notification');
                // Fallback: show badge notification
                setBadgeText('!', '#ff6b35');
                setTimeout(() => {
                    setBadgeText('', '');
                }, 5000);
            }
        }
    });
}

// Function to inject into page to show notification
function showNotification(selectedText) {
    // Create a notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #0079bf;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    const message = selectedText 
        ? `Selected text ready for Trello card. Click the Trello extension icon to continue.`
        : `Click the Trello extension icon to create a card from this page.`;
    
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">Trello Card Creator</div>
        <div>${message}</div>
        <div style="font-size: 12px; opacity: 0.9; margin-top: 8px;">Click here to dismiss</div>
    `;
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
        notification.remove();
    });
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// Keyboard shortcut handler (only if API is available)
if (chrome.commands) {
    chrome.commands.onCommand.addListener(async (command) => {
        if (command === 'create-card') {
            // Get the active tab and show notification
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: showNotification,
                    args: ['']
                });
            } catch (error) {
                console.log('Could not inject script for keyboard shortcut');
                // Fallback: show badge notification
                setBadgeText('⌨', '#0079bf');
                setTimeout(() => {
                    setBadgeText('', '');
                }, 3000);
            }
        }
    });
}

// Trello API functions
async function getBoards(key, token) {
    try {
        const url = `https://api.trello.com/1/members/me/boards?key=${key}&token=${token}&filter=open&fields=id,name&lists=none`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const boards = await response.json();
        
        return {
            success: true,
            boards: boards.sort((a, b) => a.name.localeCompare(b.name))
        };
    } catch (error) {
        console.error('Error fetching boards:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function getLists(boardId, key, token) {
    try {
        const url = `https://api.trello.com/1/boards/${boardId}/lists?key=${key}&token=${token}&filter=open&fields=id,name`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const lists = await response.json();
        
        return {
            success: true,
            lists: lists
        };
    } catch (error) {
        console.error('Error fetching lists:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function createCard(title, description, listId, key, token) {
    try {
        const url = 'https://api.trello.com/1/cards';
        
        const body = new URLSearchParams({
            key: key,
            token: token,
            idList: listId,
            name: title,
            desc: description || '',
            pos: 'top'
        });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const card = await response.json();
        
        return {
            success: true,
            card: card
        };
    } catch (error) {
        console.error('Error creating card:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper function to validate Trello credentials
async function validateCredentials(key, token) {
    try {
        const url = `https://api.trello.com/1/members/me?key=${key}&token=${token}&fields=id,username`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const member = await response.json();
        
        return {
            success: true,
            member: member
        };
    } catch (error) {
        console.error('Error validating credentials:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Badge text for status indication
function setBadgeText(text, color = '#0079bf') {
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
}

// Clear badge after some time
function clearBadge(delay = 3000) {
    setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
    }, delay);
} 