document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        apiKey: document.getElementById('apiKey'),
        apiToken: document.getElementById('apiToken'),
        toggleToken: document.getElementById('toggleToken'),
        validateBtn: document.getElementById('validateBtn'),
        saveBtn: document.getElementById('saveBtn'),
        status: document.getElementById('status'),
        defaultBoard: document.getElementById('defaultBoard'),
        defaultList: document.getElementById('defaultList')
    };

    let isTokenVisible = false;

    // Load saved settings
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();

    function setupEventListeners() {
        elements.toggleToken.addEventListener('click', toggleTokenVisibility);
        elements.validateBtn.addEventListener('click', validateCredentials);
        elements.saveBtn.addEventListener('click', saveSettings);
        
        elements.apiKey.addEventListener('input', onCredentialsChange);
        elements.apiToken.addEventListener('input', onCredentialsChange);
        
        elements.defaultBoard.addEventListener('change', onBoardChange);
        elements.defaultList.addEventListener('change', onListChange);
    }

    function toggleTokenVisibility() {
        isTokenVisible = !isTokenVisible;
        elements.apiToken.type = isTokenVisible ? 'text' : 'password';
        elements.toggleToken.textContent = isTokenVisible ? 'Hide' : 'Show';
    }

    function onCredentialsChange() {
        // Clear previous validation status when credentials change
        elements.status.classList.add('hidden');
        elements.defaultBoard.disabled = true;
        elements.defaultList.disabled = true;
        clearSelectOptions(elements.defaultBoard);
        clearSelectOptions(elements.defaultList);
    }

    async function validateCredentials() {
        const key = elements.apiKey.value.trim();
        const token = elements.apiToken.value.trim();

        if (!key || !token) {
            showStatus('Please enter both API Key and Token', 'error');
            return;
        }

        try {
            elements.validateBtn.disabled = true;
            elements.validateBtn.textContent = 'Testing...';
            showStatus('Testing connection...', 'info');

            const response = await chrome.runtime.sendMessage({
                action: 'validateCredentials',
                key: key,
                token: token
            });

            if (response.success) {
                showStatus(`✓ Connection successful! Welcome, ${response.member.username}`, 'success');
                loadBoards(key, token);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Validation error:', error);
            showStatus('❌ Connection failed. Please check your credentials.', 'error');
        } finally {
            elements.validateBtn.disabled = false;
            elements.validateBtn.textContent = 'Test Connection';
        }
    }

    async function saveSettings() {
        const key = elements.apiKey.value.trim();
        const token = elements.apiToken.value.trim();

        if (!key || !token) {
            showStatus('Please enter both API Key and Token', 'error');
            return;
        }

        try {
            elements.saveBtn.disabled = true;
            elements.saveBtn.textContent = 'Saving...';

            // Save credentials
            await chrome.storage.sync.set({
                trelloKey: key,
                trelloToken: token,
                defaultBoard: elements.defaultBoard.value,
                defaultList: elements.defaultList.value
            });

            showStatus('✓ Settings saved successfully!', 'success');
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                elements.status.classList.add('hidden');
            }, 3000);

        } catch (error) {
            console.error('Save error:', error);
            showStatus('❌ Failed to save settings. Please try again.', 'error');
        } finally {
            elements.saveBtn.disabled = false;
            elements.saveBtn.textContent = 'Save Settings';
        }
    }

    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'trelloKey', 
                'trelloToken', 
                'defaultBoard', 
                'defaultList'
            ]);

            if (result.trelloKey) {
                elements.apiKey.value = result.trelloKey;
            }
            if (result.trelloToken) {
                elements.apiToken.value = result.trelloToken;
            }

            // If credentials exist, load boards
            if (result.trelloKey && result.trelloToken) {
                loadBoards(result.trelloKey, result.trelloToken, result.defaultBoard, result.defaultList);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async function loadBoards(key, token, selectedBoard, selectedList) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getBoards',
                key: key,
                token: token
            });

            if (response.success) {
                populateBoardSelect(response.boards, selectedBoard);
                elements.defaultBoard.disabled = false;
                
                // If a board was selected, load its lists
                if (selectedBoard) {
                    loadLists(selectedBoard, key, token, selectedList);
                }
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error loading boards:', error);
            showStatus('Failed to load boards', 'error');
        }
    }

    async function loadLists(boardId, key, token, selectedList) {
        if (!boardId) {
            elements.defaultList.disabled = true;
            clearSelectOptions(elements.defaultList);
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getLists',
                boardId: boardId,
                key: key,
                token: token
            });

            if (response.success) {
                populateListSelect(response.lists, selectedList);
                elements.defaultList.disabled = false;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error loading lists:', error);
            showStatus('Failed to load lists', 'error');
        }
    }

    function populateBoardSelect(boards, selectedBoard) {
        clearSelectOptions(elements.defaultBoard);
        
        boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = board.name;
            if (board.id === selectedBoard) {
                option.selected = true;
            }
            elements.defaultBoard.appendChild(option);
        });
    }

    function populateListSelect(lists, selectedList) {
        clearSelectOptions(elements.defaultList);
        
        lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = list.name;
            if (list.id === selectedList) {
                option.selected = true;
            }
            elements.defaultList.appendChild(option);
        });
    }

    function clearSelectOptions(selectElement) {
        selectElement.innerHTML = '<option value="">Select...</option>';
    }

    async function onBoardChange() {
        const boardId = elements.defaultBoard.value;
        const key = elements.apiKey.value.trim();
        const token = elements.apiToken.value.trim();
        
        if (boardId && key && token) {
            loadLists(boardId, key, token);
        } else {
            elements.defaultList.disabled = true;
            clearSelectOptions(elements.defaultList);
        }
    }

    function onListChange() {
        // List selection change is handled automatically
        // Could add additional logic here if needed
    }

    function showStatus(message, type) {
        elements.status.textContent = message;
        elements.status.className = `status ${type}`;
        elements.status.classList.remove('hidden');
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (elements.validateBtn.disabled === false && elements.apiKey.value && elements.apiToken.value) {
                validateCredentials();
            }
        }
    });
}); 