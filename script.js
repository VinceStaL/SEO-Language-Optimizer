class TextOptimizer {
    constructor() {
        this.initializeElements();
        this.addEventListeners();
        this.loadApiKey();
        this.corsProxy = 'https://cors-anywhere.herokuapp.com/';  // Add CORS proxy
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
    }

    initializeElements() {
        // Navigation elements
        this.mainLink = document.getElementById('mainLink');
        this.configLink = document.getElementById('configLink');
        this.mainInterface = document.getElementById('mainInterface');
        this.configInterface = document.getElementById('configInterface');

        // Main interface elements
        this.inputText = document.getElementById('inputText');
        this.outputText = document.getElementById('outputText');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.seoSuggestions = document.getElementById('seoSuggestions');
        this.languageSuggestions = document.getElementById('languageSuggestions');

        // Configuration elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.saveConfigBtn = document.getElementById('saveConfig');
        this.aiProviderSelect = document.getElementById('aiProvider');
        this.testConnectionBtn = document.getElementById('testConnection');
        this.connectionStatus = document.getElementById('connectionStatus');
    }

    addEventListeners() {
        // Navigation
        this.mainLink.addEventListener('click', (e) => this.handleNavigation(e, 'main'));
        this.configLink.addEventListener('click', (e) => this.handleNavigation(e, 'config'));

        // Main functionality
        this.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.analyzeBtn.addEventListener('click', () => this.analyzeText());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        // Configuration
        this.saveConfigBtn.addEventListener('click', () => this.saveConfiguration());
        this.testConnectionBtn.addEventListener('click', () => this.testConnection());
    }

    handleNavigation(e, section) {
        e.preventDefault();
        if (section === 'main') {
            this.mainInterface.classList.remove('hidden');
            this.configInterface.classList.add('hidden');
            this.mainLink.classList.add('active');
            this.configLink.classList.remove('active');
            this.connectionStatus.className = 'connection-status';  // Hide status when switching to main
        } else {
            this.mainInterface.classList.add('hidden');
            this.configInterface.classList.remove('hidden');
            this.mainLink.classList.remove('active');
            this.configLink.classList.add('active');
        }
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.inputText.value = text;
        } catch (err) {
            alert('Failed to read from clipboard. Please paste manually.');
        }
    }

    async analyzeText() {
        const encryptedApiKey = localStorage.getItem('apiKey');
        if (!encryptedApiKey) {
            alert('Please configure your API key first');
            return;
        }

        const apiKey = this.decrypt(encryptedApiKey);
        const text = this.inputText.value.trim();
        if (!text) {
            alert('Please enter some text to analyze');
            return;
        }

        try {
            this.setLoading(true);
            const [seoResults, languageResults] = await Promise.all([
                this.analyzeSEO(text, apiKey),
                this.analyzeLanguage(text, apiKey)
            ]);

            this.displayResults(seoResults, languageResults);
        } catch (error) {
            alert('Error analyzing text: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async analyzeSEO(text, apiKey) {
        const provider = localStorage.getItem('aiProvider') || 'openai';
        const endpoint = this.apiEndpoints[provider];
        
        const headers = {
            'Content-Type': 'application/json'
        };

        let body;
        const prompt = `Analyze this text for SEO optimization and provide specific suggestions.
Format your response with clear sections using markdown-style formatting:

### Keywords
- List key terms and phrases
- Suggest additional relevant keywords

### Content Structure
- Analyze headings and structure
- Suggest improvements

### Recommendations
- Provide specific optimization suggestions
- Include actionable improvements

Text to analyze: ${text}`;
        
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
                const geminiEndpoint = `${endpoint}?key=${apiKey}`;
                body = {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                };
                endpoint = geminiEndpoint;
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
        const endpoint = provider === 'claude' ? 
            this.corsProxy + this.apiEndpoints[provider] : 
            this.apiEndpoints[provider];
        
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
                const geminiEndpoint = `${endpoint}?key=${apiKey}`;
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
                endpoint = geminiEndpoint;
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

    displayResults(seoResults, languageResults) {
        // Format and display SEO suggestions
        const formattedSeoResults = this.formatSuggestions(seoResults);
        this.seoSuggestions.innerHTML = `<div class="suggestion-content">${formattedSeoResults}</div>`;
        
        // Format and display language suggestions
        const formattedLanguageResults = this.formatSuggestions(languageResults);
        this.languageSuggestions.innerHTML = `<div class="suggestion-content">${formattedLanguageResults}</div>`;
        
        // Generate optimized text based on suggestions
        this.generateOptimizedText();
    }

    generateOptimizedText() {
        // In a real implementation, this would apply the suggestions to the original text
        // For now, we'll just copy the original text
        this.outputText.value = this.inputText.value;
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.outputText.value);
            alert('Text copied to clipboard!');
        } catch (err) {
            alert('Failed to copy text to clipboard');
        }
    }

    saveConfiguration() {
        const apiKey = this.apiKeyInput.value.trim();
        const provider = this.aiProviderSelect.value;
        
        if (!apiKey) {
            alert('Please enter an API key');
            return;
        }

        // Encrypt API key before storing
        localStorage.setItem('apiKey', this.encrypt(apiKey));
        localStorage.setItem('aiProvider', provider);
        alert('Configuration saved successfully!');
        this.handleNavigation({ preventDefault: () => {} }, 'main');
    }

    loadApiKey() {
        const encryptedApiKey = localStorage.getItem('apiKey');
        const provider = localStorage.getItem('aiProvider');
        
        if (encryptedApiKey) {
            this.apiKeyInput.value = this.decrypt(encryptedApiKey);
        }
        
        if (provider) {
            this.aiProviderSelect.value = provider;
        }
    }

    setLoading(isLoading) {
        this.analyzeBtn.disabled = isLoading;
        this.analyzeBtn.textContent = isLoading ? 'Analyzing...' : 'Analyze Text';
    }

    async testConnection() {
        const apiKey = this.apiKeyInput.value.trim();
        const provider = this.aiProviderSelect.value;

        if (!apiKey) {
            this.showConnectionStatus('error', 'Please enter an API key first');
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
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TextOptimizer();
}); 