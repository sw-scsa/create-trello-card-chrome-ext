// Content script for Trello Card Creator extension
// This script runs on all web pages to extract page information

(function() {
    'use strict';

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getSelectedText') {
            const selectedText = getSelectedText();
            sendResponse({ selectedText: selectedText });
        }
        return true; // Keep message channel open for async response
    });

    function getSelectedText() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const selectedText = selection.toString().trim();
            return selectedText;
        }
        return '';
    }

    // Optional: Add visual feedback when text is selected
    function highlightSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().trim()) {
            // Could add visual indicators here if needed
        }
    }

    // Listen for text selection changes
    document.addEventListener('selectionchange', highlightSelection);

    // Helper function to get page metadata
    function getPageMetadata() {
        const metadata = {
            title: document.title,
            url: window.location.href,
            description: '',
            keywords: [],
            author: '',
            publishedDate: ''
        };

        // Get meta description
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta) {
            metadata.description = descriptionMeta.getAttribute('content');
        }

        // Get meta keywords
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (keywordsMeta) {
            metadata.keywords = keywordsMeta.getAttribute('content').split(',').map(k => k.trim());
        }

        // Get author
        const authorMeta = document.querySelector('meta[name="author"]');
        if (authorMeta) {
            metadata.author = authorMeta.getAttribute('content');
        }

        // Try to get published date
        const dateMeta = document.querySelector('meta[property="article:published_time"]') ||
                        document.querySelector('meta[name="date"]') ||
                        document.querySelector('meta[name="publish-date"]');
        if (dateMeta) {
            metadata.publishedDate = dateMeta.getAttribute('content');
        }

        return metadata;
    }

    // Extended message listener for additional data
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'getSelectedText':
                sendResponse({ selectedText: getSelectedText() });
                break;
            case 'getPageMetadata':
                sendResponse({ metadata: getPageMetadata() });
                break;
            case 'getPageContent':
                // Get main content (simplified approach)
                const mainContent = getMainContent();
                sendResponse({ content: mainContent });
                break;
        }
        return true;
    });

    function getMainContent() {
        // Try to find main content using common selectors
        const contentSelectors = [
            'main',
            'article',
            '.content',
            '.main-content',
            '#content',
            '#main',
            '.post-content',
            '.entry-content'
        ];

        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.innerText.substring(0, 1000); // Limit to 1000 chars
            }
        }

        // Fallback: get body text but exclude navigation and footer
        const bodyClone = document.body.cloneNode(true);
        
        // Remove common navigation and footer elements
        const elementsToRemove = [
            'nav', 'header', 'footer', '.nav', '.navigation', 
            '.menu', '.sidebar', '.advertisement', '.ads'
        ];
        
        elementsToRemove.forEach(selector => {
            const elements = bodyClone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        return bodyClone.innerText.substring(0, 1000);
    }

})(); 