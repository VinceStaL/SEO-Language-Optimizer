class TextOptimizer {
    constructor() {
        this.initializeElements();
        this.addEventListeners();
        this.loadApiKey();
        this.apiEndpoints = {
            openai: 'https://api.openai.com/v1/chat/completions',
            gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            deepseek: 'https://api.deepseek.com/v1/chat/completions'
        };
        this.testMessages = {
            openai: "Hello! This is a test message to verify the API connection.",
            gemini: "Hello! This is a test message to verify the API connection.",
            deepseek: "Hello! This is a test message to verify the API connection."
        };
        this.encryptionKey = 'your-encryption-key'; // In production, this should be more secure
        this.updateCurrentProviderDisplay();
    }

    initializeElements() {
        // Navigation elements
        this.seoLink = document.getElementById('seoLink');
        this.languageLink = document.getElementById('languageLink');
        this.configLink = document.getElementById('configLink');
        this.seoInterface = document.getElementById('seoInterface');
        this.languageInterface = document.getElementById('languageInterface');
        this.configInterface = document.getElementById('configInterface');

        // SEO interface elements
        this.seoInputText = document.getElementById('seoInputText');
        this.seoPasteBtn = document.getElementById('seoPasteBtn');
        this.seoAnalyzeBtn = document.getElementById('seoAnalyzeBtn');
        this.seoSuggestions = document.getElementById('seoSuggestions');
        this.targetKeywords = document.getElementById('targetKeywords');

        // Language interface elements
        this.languageInputText = document.getElementById('languageInputText');
        this.languagePasteBtn = document.getElementById('languagePasteBtn');
        this.languageAnalyzeBtn = document.getElementById('languageAnalyzeBtn');
        this.languageSuggestions = document.getElementById('languageSuggestions');

        // Configuration elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.saveConfigBtn = document.getElementById('saveConfig');
        this.aiProviderSelect = document.getElementById('aiProvider');
        this.testConnectionBtn = document.getElementById('testConnection');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.currentProvider = document.getElementById('currentProvider');
        this.removeConfigBtn = document.getElementById('removeConfig');
    }

    addEventListeners() {
        // Navigation
        this.seoLink.addEventListener('click', (e) => this.handleNavigation(e, 'seo'));
        this.languageLink.addEventListener('click', (e) => this.handleNavigation(e, 'language'));
        this.configLink.addEventListener('click', (e) => this.handleNavigation(e, 'config'));

        // SEO functionality
        this.seoPasteBtn.addEventListener('click', () => this.handlePaste('seo'));
        this.seoAnalyzeBtn.addEventListener('click', () => this.analyzeSEOText());

        // Language functionality
        this.languagePasteBtn.addEventListener('click', () => this.handlePaste('language'));
        this.languageAnalyzeBtn.addEventListener('click', () => this.analyzeLanguageText());

        // Configuration
        this.saveConfigBtn.addEventListener('click', () => this.saveConfiguration());
        this.testConnectionBtn.addEventListener('click', () => this.testConnection());
        this.removeConfigBtn.addEventListener('click', () => this.removeConfiguration());
    }

    handleNavigation(e, section) {
        e.preventDefault();
        
        // Hide all interfaces
        this.seoInterface.classList.add('hidden');
        this.languageInterface.classList.add('hidden');
        this.configInterface.classList.add('hidden');

        // Remove active class from all links
        this.seoLink.classList.remove('active');
        this.languageLink.classList.remove('active');
        this.configLink.classList.remove('active');

        // Show selected interface and activate corresponding link
        switch(section) {
            case 'seo':
                this.seoInterface.classList.remove('hidden');
                this.seoLink.classList.add('active');
                break;
            case 'language':
                this.languageInterface.classList.remove('hidden');
                this.languageLink.classList.add('active');
                break;
            case 'config':
                this.configInterface.classList.remove('hidden');
                this.configLink.classList.add('active');
                break;
        }
    }

    async handlePaste(type) {
        try {
            const text = await navigator.clipboard.readText();
            if (type === 'seo') {
                this.seoInputText.value = text;
            } else {
                this.languageInputText.value = text;
            }
        } catch (err) {
            alert('Failed to read from clipboard. Please paste manually.');
        }
    }

    async analyzeSEOText() {
        const encryptedApiKey = localStorage.getItem('apiKey');
        if (!encryptedApiKey) {
            alert('Please configure your API key first');
            return;
        }

        const apiKey = this.decrypt(encryptedApiKey);
        const text = this.seoInputText.value.trim();
        if (!text) {
            alert('Please enter some text to analyze');
            return;
        }

        try {
            this.setLoading(true);
            const seoResults = await this.analyzeSEO(text, apiKey);
            this.displaySEOSuggestions(seoResults);
        } catch (error) {
            alert('Error analyzing text: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async analyzeLanguageText() {
        const encryptedApiKey = localStorage.getItem('apiKey');
        if (!encryptedApiKey) {
            alert('Please configure your API key first');
            return;
        }

        const apiKey = this.decrypt(encryptedApiKey);
        const text = this.languageInputText.value.trim();
        if (!text) {
            alert('Please enter some text to analyze');
            return;
        }

        try {
            this.setLoading(true);
            const languageResults = await this.analyzeLanguage(text, apiKey);
            this.displayLanguageSuggestions(languageResults);
        } catch (error) {
            alert('Error analyzing text: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async analyzeSEO(text, apiKey) {
        const provider = localStorage.getItem('aiProvider') || 'openai';
        let endpoint = this.apiEndpoints[provider];
        
        const headers = {
            'Content-Type': 'application/json'
        };

        // Get and process target keywords
        const keywords = this.targetKeywords.value.trim()
            ? this.targetKeywords.value.split(',').map(k => k.trim()).join(', ')
            : 'no specific keywords provided';

        let body;
        const prompt = `Analyze the following content for SEO effectiveness and provide actionable recommendations. Focus on:

Keyword Optimization: Identify if primary/secondary keywords (e.g., ${keywords}) are used effectively. Check density, placement (title, headers, body), and semantic relevance.

Readability: Assess content structure, sentence length, paragraph breaks, and use of subheadings (H2, H3).

Meta Elements: Suggest improvements for meta titles, descriptions, and alt text for images.

Content Quality: Evaluate uniqueness, depth, and relevance to search intent. Does it answer user queries better than competitors?

Internal/External Linking: Check for opportunities to add authoritative external links or internal links to related content.

Technical SEO: Highlight potential issues like duplicate content, missing headers, or mobile-friendliness (if detectable).

Competitor Comparison: How does this content compare to top-ranking pages for the target keywords?

Content to analyze: ${text}`;
        
        switch(provider) {
            case 'openai':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = {
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user",
                        content: prompt
                    }]
                };
                break;
                
            case 'gemini':
                endpoint = `${endpoint}?key=${apiKey}`;
                body = {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                };
                break;
                
            case 'deepseek':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = {
                    model: "deepseek-chat",
                    messages: [{
                        role: "user",
                        content: prompt
                    }]
                };
                break;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        // Handle different response formats
        switch(provider) {
            case 'openai':
                return data.choices[0].message.content;
            case 'gemini':
                return data.candidates[0].content.parts[0].text;
            case 'deepseek':
                return data.choices[0].message.content;
            default:
                return 'Unable to process response';
        }
    }

    async analyzeLanguage(text, apiKey) {
        const provider = localStorage.getItem('aiProvider') || 'openai';
        let endpoint = this.apiEndpoints[provider];  // Change const to let
        
        const headers = {
            'Content-Type': 'application/json'
        };

        let body;
        
        switch(provider) {
            case 'openai':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = {
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user",
                        content: `Analyze this text and suggest improvements to make it sound more natural and human-like.
Format your response with clear sections using markdown-style formatting:

### Writing Style Analysis
- Identify overly formal or robotic phrases
- Point out mechanical or artificial-sounding expressions
- Highlight repetitive or stilted language patterns

### Natural Alternatives
- Provide conversational alternatives for formal phrases
- Suggest more engaging ways to express the ideas
- Offer human-like sentence variations

### Flow Improvements
- Recommend better transitions
- Suggest ways to vary sentence structure
- Provide tips for more natural rhythm and pacing

Text to analyze: ${text}`
                    }]
                };
                break;
                
            case 'gemini':
                endpoint = `${endpoint}?key=${apiKey}`;  // Now we can modify endpoint
                body = {
                    contents: [{
                        parts: [{
                            text: `Analyze this text and suggest improvements to make it sound more natural and human-like.
Format your response with clear sections using markdown-style formatting:

### Writing Style Analysis
- Identify overly formal or robotic phrases
- Point out mechanical or artificial-sounding expressions
- Highlight repetitive or stilted language patterns

### Natural Alternatives
- Provide conversational alternatives for formal phrases
- Suggest more engaging ways to express the ideas
- Offer human-like sentence variations

### Flow Improvements
- Recommend better transitions
- Suggest ways to vary sentence structure
- Provide tips for more natural rhythm and pacing

Text to analyze: ${text}`
                        }]
                    }]
                };
                break;
                
            case 'deepseek':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = {
                    model: "deepseek-chat",
                    messages: [{
                        role: "user",
                        content: `Analyze this text and suggest improvements to make it sound more natural and human-like.
Format your response with clear sections using markdown-style formatting:

### Writing Style Analysis
- Identify overly formal or robotic phrases
- Point out mechanical or artificial-sounding expressions
- Highlight repetitive or stilted language patterns

### Natural Alternatives
- Provide conversational alternatives for formal phrases
- Suggest more engaging ways to express the ideas
- Offer human-like sentence variations

### Flow Improvements
- Recommend better transitions
- Suggest ways to vary sentence structure
- Provide tips for more natural rhythm and pacing

Text to analyze: ${text}`
                    }]
                };
                break;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        // Handle different response formats
        switch(provider) {
            case 'openai':
                return data.choices[0].message.content;
            case 'gemini':
                return data.candidates[0].content.parts[0].text;
            case 'deepseek':
                return data.choices[0].message.content;
            default:
                return 'Unable to process response';
        }
    }

    displaySEOSuggestions(seoResults) {
        // Format and display SEO suggestions
        const formattedSeoResults = this.formatSuggestions(seoResults);
        this.seoSuggestions.innerHTML = `<div class="suggestion-content">${formattedSeoResults}</div>`;
    }

    displayLanguageSuggestions(languageResults) {
        // Format and display language suggestions
        const formattedLanguageResults = this.formatSuggestions(languageResults);
        this.languageSuggestions.innerHTML = `<div class="suggestion-content">${formattedLanguageResults}</div>`;
    }

    saveConfiguration() {
        const apiKey = this.apiKeyInput.value.trim();
        const provider = this.aiProviderSelect.value;
        
        if (!apiKey) {
            alert('Please enter an API key');
            return;
        }

        localStorage.setItem('apiKey', this.encrypt(apiKey));
        localStorage.setItem('aiProvider', provider);
        this.updateCurrentProviderDisplay();
        alert('Configuration saved successfully!');
    }

    loadApiKey() {
        const encryptedApiKey = localStorage.getItem('apiKey');
        const provider = localStorage.getItem('aiProvider');
        
        if (encryptedApiKey) {
            this.apiKeyInput.value = this.decrypt(encryptedApiKey);
        }
        
        if (provider) {
            this.aiProviderSelect.value = provider;
            this.updateCurrentProviderDisplay();
        }
    }

    setLoading(isLoading) {
        this.seoAnalyzeBtn.disabled = isLoading;
        this.seoAnalyzeBtn.textContent = isLoading ? 'Analyzing...' : 'Analyze Text';
        this.languageAnalyzeBtn.disabled = isLoading;
        this.languageAnalyzeBtn.textContent = isLoading ? 'Analyzing...' : 'Analyze Text';
    }

    async testConnection() {
        // Get the stored API key first
        const encryptedApiKey = localStorage.getItem('apiKey');
        const provider = this.aiProviderSelect.value;

        // If no stored key, then check input field
        const apiKey = encryptedApiKey ? 
            this.decrypt(encryptedApiKey) : 
            this.apiKeyInput.value.trim();

        if (!apiKey) {
            this.showConnectionStatus('error', 'No API key found. Please enter an API key first');
            return;
        }

        this.showConnectionStatus('testing', 'Testing connection...');

        try {
            const response = await this.makeTestRequest(provider, apiKey);
            if (response) {
                this.showConnectionStatus('success', `Successfully connected to ${provider.toUpperCase()} API`);
            } else {
                this.showConnectionStatus('error', `Failed to connect to ${provider.toUpperCase()} API`);
            }
        } catch (error) {
            this.showConnectionStatus('error', `Connection error: ${error.message}`);
        }
    }

    async makeTestRequest(provider, apiKey) {
        let endpoint = this.apiEndpoints[provider];
        const headers = {
            'Content-Type': 'application/json'
        };

        let body;
        let finalEndpoint = endpoint;  // Store the final endpoint to use
        
        switch(provider) {
            case 'openai':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = {
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user",
                        content: this.testMessages[provider]
                    }]
                };
                break;
                
            case 'gemini':
                finalEndpoint = `${endpoint}?key=${apiKey}`;  // Update the final endpoint for Gemini
                body = {
                    contents: [{
                        parts: [{
                            text: this.testMessages[provider]
                        }]
                    }]
                };
                break;
                
            case 'deepseek':
                headers['Authorization'] = `Bearer ${apiKey}`;
                body = {
                    model: "deepseek-chat",
                    messages: [{
                        role: "user",
                        content: this.testMessages[provider]
                    }]
                };
                break;
        }

        try {
            const response = await fetch(finalEndpoint, {  // Use finalEndpoint instead
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error details:', error);
            throw new Error(`API Error: ${error.message}`);
        }
    }

    showConnectionStatus(type, message) {
        this.connectionStatus.className = `connection-status ${type}`;
        this.connectionStatus.textContent = message;
    }

    // Add encryption/decryption methods
    encrypt(text) {
        return btoa(
            encodeURIComponent(text).split('').map((c, i) => {
                return String.fromCharCode(c.charCodeAt(0) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
            }).join('')
        );
    }

    decrypt(encoded) {
        try {
            return decodeURIComponent(
                atob(encoded).split('').map((c, i) => {
                    return String.fromCharCode(c.charCodeAt(0) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
                }).join('')
            );
        } catch(e) {
            return '';
        }
    }

    // Add new method to format suggestions
    formatSuggestions(text) {
        if (!text) return '';

        // Convert markdown-style lists to HTML
        let formatted = text
            // Convert numbered lists (1. 2. etc)
            .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
            // Convert bullet points (* or -)
            .replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>')
            // Wrap consecutive list items in ul tags
            .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
            // Convert markdown headings (### or ##)
            .replace(/^###?\s+(.+)$/gm, '<h3>$1</h3>')
            // Convert double newlines to paragraph breaks
            .replace(/\n\n/g, '</p><p>')
            // Convert single newlines to line breaks
            .replace(/\n/g, '<br>');

        // Wrap in paragraph tags if not already wrapped
        if (!formatted.startsWith('<')) {
            formatted = `<p>${formatted}</p>`;
        }

        // Add section dividers for better organization
        formatted = formatted
            .replace(/<h3>/g, '</div><div class="suggestion-section"><h3>')
            .replace(/^/, '<div class="suggestion-section">')
            .replace(/$/, '</div>');

        // Clean up any empty sections
        formatted = formatted.replace(/<div class="suggestion-section"><\/div>/g, '');

        return formatted;
    }

    updateCurrentProviderDisplay() {
        const provider = localStorage.getItem('aiProvider');
        if (provider) {
            const providerNames = {
                'openai': 'OpenAI',
                'gemini': 'Google Gemini',
                'deepseek': 'DeepSeek'
            };
            this.currentProvider.textContent = providerNames[provider];
        } else {
            this.currentProvider.textContent = 'Not configured';
        }
    }

    removeConfiguration() {
        if (confirm('Are you sure you want to remove the saved configuration?')) {
            localStorage.removeItem('apiKey');
            localStorage.removeItem('aiProvider');
            this.apiKeyInput.value = '';
            this.aiProviderSelect.value = 'openai'; // Reset to default
            this.updateCurrentProviderDisplay();
            alert('Configuration removed successfully!');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TextOptimizer();
}); 