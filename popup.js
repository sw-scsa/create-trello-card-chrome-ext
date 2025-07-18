document.addEventListener('DOMContentLoaded', async () => {
    const elements = {
        pageTitle: document.getElementById('pageTitle'),
        pageUrl: document.getElementById('pageUrl'),
        cardTitle: document.getElementById('cardTitle'),
        cardDesc: document.getElementById('cardDesc'),
        boardSelect: document.getElementById('boardSelect'),
        listSelect: document.getElementById('listSelect'),
        includeUrl: document.getElementById('includeUrl'),
        includeSelection: document.getElementById('includeSelection'),
        createCard: document.getElementById('createCard'),
        openOptions: document.getElementById('openOptions'),
        cardForm: document.getElementById('cardForm'),
        status: document.getElementById('status')
    };

    let currentTab = null;
    let selectedText = '';

    // Load page information
    await loadPageInfo();
    
    // Load boards
    await loadBoards();
    
    // Set up event listeners
    setupEventListeners();

    async function loadPageInfo() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tab;
            
            elements.pageTitle.textContent = tab.title || 'No title';
            elements.pageUrl.textContent = tab.url || 'No URL';
            elements.cardTitle.value = formatTitle(tab.title || '');
            
            // Get selected text from content script
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
                selectedText = response?.selectedText || '';
                elements.includeSelection.disabled = !selectedText;
                if (!selectedText) {
                    elements.includeSelection.parentElement.style.opacity = '0.5';
                }
            } catch (error) {
                console.log('Content script not ready or no selected text');
                elements.includeSelection.disabled = true;
                elements.includeSelection.parentElement.style.opacity = '0.5';
            }
        } catch (error) {
            console.error('Error loading page info:', error);
            showStatus('Error loading page information', 'error');
        }
    }

    async function loadBoards() {
        try {
            const config = await chrome.storage.sync.get(['trelloKey', 'trelloToken']);
            
            if (!config.trelloKey || !config.trelloToken) {
                showStatus('Please configure your Trello API credentials in settings', 'error');
                elements.createCard.disabled = true;
                return;
            }

            const response = await chrome.runtime.sendMessage({
                action: 'getBoards',
                key: config.trelloKey,
                token: config.trelloToken
            });

            if (response.success) {
                populateBoardSelect(response.boards);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error loading boards:', error);
            showStatus('Error loading boards. Check your API credentials.', 'error');
            elements.createCard.disabled = true;
        }
    }

    function populateBoardSelect(boards) {
        elements.boardSelect.innerHTML = '<option value="">Select a board...</option>';
        
        boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = board.name;
            elements.boardSelect.appendChild(option);
        });
        
        // Load saved board preference
        chrome.storage.sync.get(['defaultBoard'], (result) => {
            if (result.defaultBoard) {
                elements.boardSelect.value = result.defaultBoard;
                loadLists(result.defaultBoard);
            }
        });
    }

    async function loadLists(boardId) {
        if (!boardId) {
            elements.listSelect.innerHTML = '<option value="">Select a list...</option>';
            elements.listSelect.disabled = true;
            return;
        }

        try {
            const config = await chrome.storage.sync.get(['trelloKey', 'trelloToken']);
            
            // Load lists and labels simultaneously
            const [listsResponse, labelsResponse] = await Promise.all([
                chrome.runtime.sendMessage({
                    action: 'getLists',
                    boardId: boardId,
                    key: config.trelloKey,
                    token: config.trelloToken
                }),
                chrome.runtime.sendMessage({
                    action: 'getLabels',
                    boardId: boardId,
                    key: config.trelloKey,
                    token: config.trelloToken
                })
            ]);

            if (listsResponse.success) {
                populateListSelect(listsResponse.lists);
                elements.listSelect.disabled = false;
            } else {
                throw new Error(listsResponse.error);
            }

            if (labelsResponse.success) {
                // availableLabels = labelsResponse.labels; // Removed as per edit hint
                console.log('Available labels:', labelsResponse.labels);
            }
        } catch (error) {
            console.error('Error loading lists/labels:', error);
            showStatus('Error loading lists', 'error');
        }
    }

    function populateListSelect(lists) {
        elements.listSelect.innerHTML = '<option value="">Select a list...</option>';
        
        lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = list.name;
            elements.listSelect.appendChild(option);
        });
        
        // Load saved list preference
        chrome.storage.sync.get(['defaultList'], (result) => {
            if (result.defaultList) {
                elements.listSelect.value = result.defaultList;
            }
        });
    }

    function setupEventListeners() {
        elements.boardSelect.addEventListener('change', (e) => {
            const boardId = e.target.value;
            loadLists(boardId);
            
            // Save board preference
            if (boardId) {
                chrome.storage.sync.set({ defaultBoard: boardId });
            }
        });

        elements.listSelect.addEventListener('change', (e) => {
            const listId = e.target.value;
            
            // Save list preference
            if (listId) {
                chrome.storage.sync.set({ defaultList: listId });
            }
        });

        elements.cardForm.addEventListener('submit', handleCreateCard);
        
        elements.openOptions.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    async function handleCreateCard(e) {
        e.preventDefault();
        
        const title = elements.cardTitle.value.trim();
        const boardId = elements.boardSelect.value;
        const listId = elements.listSelect.value;
        
        if (!title) {
            showStatus('Please enter a card title', 'error');
            return;
        }
        
        if (!boardId || !listId) {
            showStatus('Please select a board and list', 'error');
            return;
        }

        // Build description
        let description = elements.cardDesc.value.trim();
        
        if (elements.includeUrl.checked && currentTab?.url) {
            description += (description ? '\n\n' : '') + `Source: ${currentTab.url}`;
        }
        
        if (elements.includeSelection.checked && selectedText) {
            description += (description ? '\n\n' : '') + `Selected text:\n${selectedText}`;
        }

        try {
            elements.createCard.disabled = true;
            elements.createCard.textContent = 'Creating...';
            showStatus('Creating card...', 'info');
            
            const config = await chrome.storage.sync.get(['trelloKey', 'trelloToken']);
            
            const response = await chrome.runtime.sendMessage({
                action: 'createCard',
                title: title,
                description: description,
                listId: listId,
                // labels: detectedLabels, // Removed as per edit hint
                // availableLabels: availableLabels, // Removed as per edit hint
                key: config.trelloKey,
                token: config.trelloToken
            });

            if (response.success) {
                // Open the created card in a new tab
                if (response.card && (response.card.url || response.card.shortUrl)) {
                    const cardUrl = response.card.url || response.card.shortUrl;
                    chrome.tabs.create({ 
                        url: cardUrl,
                        active: true // Open in foreground to show the created card
                    });
                    
                    let message = 'Card created and opened in new tab!';
                    // if (detectedLabels.length > 0) { // Removed as per edit hint
                    //     message += ` Labels applied: ${detectedLabels.join(', ')}`;
                    // }
                    showStatus(message, 'success');
                } else {
                    let message = 'Card created successfully!';
                    // if (detectedLabels.length > 0) { // Removed as per edit hint
                    //     message += ` Labels applied: ${detectedLabels.join(', ')}`;
                    // }
                    showStatus(message, 'success');
                }
                
                setTimeout(() => {
                    window.close();
                }, 1000);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error creating card:', error);
            showStatus('Error creating card. Please try again.', 'error');
        } finally {
            elements.createCard.disabled = false;
            elements.createCard.textContent = 'Create Card';
        }
    }

    function formatTitle(title) {
        if (!title) return '';
        
        // Remove label pattern detection
        // const labelPatterns = [
        //     /\b(bug|fix|issue|error|problem)[\s:]/gi,
        //     /\b(feature|enhancement|improvement|new)[\s:]/gi,
        //     /\b(urgent|critical|high|important|priority)[\s:]/gi,
        //     /\b(documentation|docs|readme)[\s:]/gi,
        //     /\b(test|testing|qa)[\s:]/gi,
        //     /\b(refactor|cleanup|optimize)[\s:]/gi,
        //     /\[(bug|fix|issue|error|problem|feature|enhancement|improvement|new|urgent|critical|high|important|priority|documentation|docs|readme|test|testing|qa|refactor|cleanup|optimize)\]/gi
        // ];
        
        // Remove label extraction logic
        // labelPatterns.forEach(pattern => {
        //     const matches = cleanTitle.match(pattern);
        //     if (matches) {
        //         matches.forEach(match => {
        //             let labelText = match.replace(/[\[\]:]/g, '').trim().toLowerCase();
        //             const labelMapping = {
        //                 'fix': 'bug',
        //                 'issue': 'bug', 
        //                 'error': 'bug',
        //                 'problem': 'bug',
        //                 'enhancement': 'feature',
        //                 'improvement': 'feature',
        //                 'new': 'feature',
        //                 'critical': 'urgent',
        //                 'high': 'urgent',
        //                 'important': 'urgent',
        //                 'priority': 'urgent',
        //                 'docs': 'documentation',
        //                 'readme': 'documentation',
        //                 'testing': 'test',
        //                 'qa': 'test',
        //                 'cleanup': 'refactor',
        //                 'optimize': 'refactor'
        //             };
        //             labelText = labelMapping[labelText] || labelText;
        //             if (!detectedLabels.includes(labelText)) {
        //                 detectedLabels.push(labelText);
        //             }
        //             cleanTitle = cleanTitle.replace(match, '');
        //         });
        //     }
        // });
        
        // Remove display of detected labels
        // displayDetectedLabels();
        
        // Find all text in square brackets (non-label brackets)
        const bracketMatches = title.match(/\[([^\]]+)\]/g) || [];
        
        // Remove brackets from title
        bracketMatches.forEach(match => {
            title = title.replace(match, '');
        });
        
        // Clean up extra spaces
        title = title.replace(/\s+/g, ' ').trim();
        
        // Remove the specific string '- Jira Service Management' from the title
        title = title.replace(/- Jira Service Management/g, '').trim();
        
        // Extract content from brackets (remove the [ ] characters)
        const bracketContent = bracketMatches.map(match => 
            match.replace(/[\[\]]/g, '')
        );
        
        // Combine title with bracket content
        if (bracketContent.length > 0) {
            title = `${title} | ${bracketContent.join(' | ')}`;
        }
        
        return title;
    }

    function showStatus(message, type) {
        elements.status.textContent = message;
        elements.status.className = `status ${type}`;
        elements.status.classList.remove('hidden');
        
        if (type === 'success') {
            setTimeout(() => {
                elements.status.classList.add('hidden');
            }, 3000);
        }
    }
}); 