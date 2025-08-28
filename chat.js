// Array to store the current conversation messages
let currentConversation = [];

// Event listeners for chat functionality
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const backBtn = document.getElementById('back-btn');
    const closeChat = document.getElementById('close-chat');
    
    // Send message when send button is clicked
    sendBtn.addEventListener('click', sendMessage);
    
    // Send message when Enter key is pressed (but allow shift+enter for new lines)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        
        // Auto resize the textarea
        setTimeout(() => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        }, 0);
    });
    
    // Go back to model selection
    backBtn.addEventListener('click', () => {
        backToModelSelection();
    });
    
    // Close chat (same as back button)
    closeChat.addEventListener('click', () => {
        backToModelSelection();
    });
});

// Function to send a message
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message || !currentModel) return;
    
    // Add user message to the chat
    addMessageToChat('user', message);
    
    // Add the message to the conversation array
    currentConversation.push({
        role: 'user',
        content: message
    });
    
    // Save the conversation to localStorage
    saveConversation();
    
    // Clear the input field and reset its height
    messageInput.value = '';
    messageInput.style.height = '45px';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Check if API key is available
        if (!window.OPENROUTER_API_KEY) {
            if (!setupApiKey()) {
                hideTypingIndicator();
                addMessageToChat('ai', "Please provide a valid OpenRouter API key to continue.");
                return;
            }
        }
        
        // Send the message to OpenRouter API
        const response = await sendToAI(message);
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Add AI response to the chat
        addMessageToChat('ai', response);
        
        // Add the response to the conversation array
        currentConversation.push({
            role: 'assistant',
            content: response
        });
        
        // Save the updated conversation to localStorage
        saveConversation();
        
        // Update the conversation history in the sidebar
        updateConversationHistory();
        
        // Highlight the current conversation
        if (currentModel) {
            highlightCurrentConversation(currentModel.id);
        }
    } catch (error) {
        // Remove typing indicator
        hideTypingIndicator();
        
        // Show error message
        addMessageToChat('ai', `Sorry, I encountered an error: ${error.message}`);
    }
}

// Function to add a message to the chat UI
function addMessageToChat(role, content) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    // Check if content contains HTML (for image generation)
    if (content.startsWith('<div class="generated-image">')) {
        messageDiv.innerHTML = `
            ${content}
            <div class="message-avatar">
                <i class="fas ${role === 'ai' ? 'fa-robot' : 'fa-user'}"></i>
            </div>
        `;
    } else {
        // Regular text message
        // Replace newlines with <br> tags for proper display
        const formattedContent = content.replace(/\n/g, '<br>');
        
        // Add avatar icon based on role
        const avatarIcon = role === 'ai' ? 'fa-robot' : 'fa-user';
        
        messageDiv.innerHTML = `
            ${formattedContent}
            <div class="message-avatar">
                <i class="fas ${avatarIcon}"></i>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    chatMessages.appendChild(typingDiv);
    
    // Scroll to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Function to save the current conversation to localStorage
function saveConversation() {
    if (!currentModel) return;
    
    const conversationKey = `chat_${currentModel.id}`;
    localStorage.setItem(conversationKey, JSON.stringify(currentConversation));
}

// Function to send message to OpenRouter API
async function sendToAI(message) {
    if (!currentModel) {
        throw new Error('No model selected');
    }
    
    // Check if this is an image generation request
    if (currentModel.isImageGenerator) {
        return await generateImageWithHuggingFace(message);
    }
    
    // Handle different API providers
    if (currentModel.provider === 'deepseek') {
        return await sendToDeepSeek(message);
    } else if (currentModel.provider === 'grok') {
        return await sendToGrok(message);
    }
    
    // Default: OpenRouter API
    // First check for model-specific API key
    let apiKey = localStorage.getItem(`model_specific_key_${currentModel.id}`);
    
    // If no model-specific key, get provider key
    if (!apiKey) {
        apiKey = window.OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key');
    }
    
    // Still no key found
    if (!apiKey) {
        throw new Error('No auth credentials found. Please set your API key in settings.');
    }
    
    let attempts = 0;
    const maxAttempts = currentModel.id === 'anthropic/claude-3-opus' ? 2 : 1; // Retry for Opus
    
    while (attempts < maxAttempts) {
        try {
            attempts++;
            
            // Format messages for the API
            const messages = currentConversation.map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : msg.role,
                content: msg.content
            }));
            
            // Adjust request parameters based on model
            let maxTokens = 1000;
            let temperature = 0.7;
            
            // Special handling for Claude 3 Opus which needs different parameters
            if (currentModel.id === 'anthropic/claude-3-opus') {
                maxTokens = 2000 - (attempts > 1 ? 500 : 0); // Reduce tokens on retry
                temperature = 0.3 - (attempts > 1 ? 0.1 : 0); // Lower temperature on retry
            }
            
            // Make API request to OpenRouter
            console.log(`Sending request to OpenRouter for model: ${currentModel.id} (Attempt ${attempts})`);
            console.log('Using API key:', apiKey ? 'Key is set (masked)' : 'No key found');
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'AI Chat App'
                },
                body: JSON.stringify({
                    model: currentModel.id,
                    messages: messages,
                    max_tokens: maxTokens,
                    temperature: temperature,
                    stream: false, // Ensure streaming is disabled for more reliable responses
                    top_p: 0.9, // Add top_p parameter for better results with Claude models
                    timeout: 120 // Increase timeout for Claude 3 Opus
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to get response from AI';
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (e) {
                    // If JSON parsing fails, use the raw error text
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log("API Response:", data);
            
            // Enhanced validation for the response structure
            if (!data) {
                throw new Error('Empty response from API');
            }
            
            if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
                throw new Error('No choices in API response');
            }
            
            const choice = data.choices[0];
            if (!choice) {
                throw new Error('Empty choice in API response');
            }
            
            // Different models might return content in different structures
            if (choice.message && typeof choice.message.content === 'string') {
                return choice.message.content;
            } else if (choice.text && typeof choice.text === 'string') {
                return choice.text;
            } else if (typeof choice.content === 'string') {
                return choice.content;
            }
            
            // If we reach here, we couldn't find the content in an expected format
            throw new Error('Could not parse content from API response');
        } catch (error) {
            console.error(`Error sending message to AI (Attempt ${attempts}):`, error);
            
            // If we've reached max attempts or it's not Claude 3 Opus, throw the error
            if (attempts >= maxAttempts || currentModel.id !== 'anthropic/claude-3-opus') {
                throw error;
            }
            
            // Otherwise, we'll retry with different parameters
            console.log("Retrying with adjusted parameters...");
        }
    }
}

// Function to generate image with Hugging Face
async function generateImageWithHuggingFace(prompt) {
    // Get Hugging Face API key - first check localStorage, then try to find from stored keys
    let apiKey = window.HUGGINGFACE_API_KEY || localStorage.getItem('huggingface_api_key');
    
    // If no API key in localStorage, try to find from stored keys
    if (!apiKey) {
        const storedKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');
        const huggingFaceKey = storedKeys.find(k => 
            k.provider === 'huggingface' || 
            k.name.toLowerCase().includes('hugging') || 
            k.name.toLowerCase().includes('face')
        );
        
        if (huggingFaceKey) {
            apiKey = huggingFaceKey.key;
            localStorage.setItem('huggingface_api_key', apiKey);
            window.HUGGINGFACE_API_KEY = apiKey;
        }
    }
    
    if (!apiKey) {
        throw new Error('Hugging Face API key is required for image generation. Please add one in Manage API settings.');
    }
    
    try {
        // Show a message that image is being generated
        showToast('Generating image, please wait...');
        
        // Use stable-diffusion-xl model for good quality images
        const model = "stabilityai/stable-diffusion-xl-base-1.0";
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to generate image: ${error}`);
        }
        
        // Get image as blob
        const blob = await response.blob();
        
        // Convert blob to base64 data URL
        const imageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        
        // Return HTML with image
        return `
            <div class="generated-image">
                <p>Generated image based on: "${prompt}"</p>
                <img src="${imageUrl}" alt="${prompt}" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">
            </div>
        `;
    } catch (error) {
        console.error('Error generating image:', error);
        throw new Error(`Failed to generate image: ${error.message}`);
    }
}

// Function to send request to DeepSeek
async function sendToDeepSeek(message) {
    try {
        // First check for model-specific API key
        let apiKey = localStorage.getItem(`model_specific_key_${currentModel.id}`);
        
        // If no model-specific key, try to use OpenRouter key
        if (!apiKey) {
            apiKey = window.OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key');
        }
        
        if (!apiKey) {
            throw new Error('API key is required for DeepSeek. Please add one in settings.');
        }
        
        // Format messages for the API
        const messages = currentConversation.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        }));
        
        // Use OpenRouter to access DeepSeek model
        console.log('Sending request to DeepSeek via OpenRouter');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Chat App'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-coder',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to get response from DeepSeek';
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('DeepSeek API response:', data);
        
        if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message && choice.message.content) {
                return choice.message.content;
            }
        }
        
        throw new Error('Invalid response format from DeepSeek');
    } catch (error) {
        console.error('Error with DeepSeek API:', error);
        throw error;
    }
}

// Function to send request to Grok
async function sendToGrok(message) {
    try {
        // First check for model-specific API key
        let apiKey = localStorage.getItem(`model_specific_key_${currentModel.id}`);
        
        // If no model-specific key, try to use OpenRouter key
        if (!apiKey) {
            apiKey = window.OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key');
        }
        
        if (!apiKey) {
            throw new Error('API key is required for Grok AI. Please add one in settings.');
        }
        
        // Format messages for the API
        const messages = currentConversation.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        }));
        
        // Use OpenRouter to access Grok model
        console.log('Sending request to Grok AI via OpenRouter');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Chat App'
            },
            body: JSON.stringify({
                model: 'xai/grok-1',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to get response from Grok AI';
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Grok API response:', data);
        
        if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message && choice.message.content) {
                return choice.message.content;
            }
        }
        
        throw new Error('Invalid response format from Grok AI');
    } catch (error) {
        console.error('Error with Grok AI:', error);
        throw error;
    }
}

// Function to clear all conversations
function clearAllConversations() {
    // Get all keys from localStorage that start with 'chat_'
    const keys = Object.keys(localStorage).filter(key => key.startsWith('chat_'));
    
    // Remove each conversation from localStorage
    keys.forEach(key => {
        localStorage.removeItem(key);
    });
    
    // Update the conversation history in the sidebar
    updateConversationHistory();
    
    // If in a chat, go back to model selection
    if (currentModel) {
        backToModelSelection();
    }
    
    // Show success toast
    if (typeof showToast === 'function') {
        showToast('All conversations cleared');
    }
}

// Handle emoji reactions (example addition)
function addEmojiReaction(emojiCode) {
    if (!currentModel) return;
    
    const message = `${emojiCode}${emojiCode}`;
    
    // Add user message to the chat
    addMessageToChat('user', message);
    
    // Add the message to the conversation array
    currentConversation.push({
        role: 'user',
        content: message
    });
    
    // Save the conversation to localStorage
    saveConversation();
    
    // Simulate AI response to emoji
    setTimeout(() => {
        let response = "Glad I could make you laugh! Is there anything else I can help you with today?";
        
        if (emojiCode === "😊" || emojiCode === "👍") {
            response = "Thanks for the positive feedback! Anything else you'd like to discuss?";
        } else if (emojiCode === "❤️") {
            response = "I appreciate that! How can I assist you further?";
        }
        
        // Add AI response to the chat
        addMessageToChat('ai', response);
        
        // Add the response to the conversation array
        currentConversation.push({
            role: 'assistant',
            content: response
        });
        
        // Save the updated conversation to localStorage
        saveConversation();
    }, 1000);
}