// Main app initialization
document.addEventListener('DOMContentLoaded', () => {
    // Load persisted provider keys into runtime
    hydrateProviderKeysFromStorage();

    // Cleanup/migrate legacy predefined key entries
    importPredefinedAPIKeys();

    // Initialize model selection grid
    initializeModelsGrid();

    // Initialize sidebar toggle functionality
    initSidebar();

    // Initialize dark mode toggle
    initDarkMode();

    // Initialize conversation history
    updateConversationHistory();

    // Initialize clear conversations button
    initClearConversations();

    // Initialize Manage API button
    initManageAPI();

    // Initialize user profile
    initUserProfile();

    // Initialize about modal
    initAboutModal();

    // Initialize emoji picker
    initEmojiPicker();

    // Initialize voice input
    initVoiceInput();

    // Show app loader initially and hide after loading
    showLoader(false);
});

// Show or hide the app loader
function showLoader(show = true) {
    const loader = document.getElementById('app-loader');
    loader.style.display = show ? 'flex' : 'none';
}

// Function to initialize sidebar functionality
function initSidebar() {
    const menuBtn = document.getElementById('menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    menuBtn.addEventListener('click', () => {
        toggleSidebar();
    });

    closeSidebarBtn.addEventListener('click', () => {
        toggleSidebar();
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== menuBtn) {
            toggleSidebar();
        }
    });

    // Function to toggle sidebar visibility without automatically closing
    window.toggleSidebar = function (forceState = null) {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');

        if (forceState === true) {
            // Force open
            sidebar.classList.add('open');
            mainContent.classList.add('sidebar-open');
        } else if (forceState === false) {
            // Force close
            sidebar.classList.remove('open');
            mainContent.classList.remove('sidebar-open');
        } else {
            // Toggle
            sidebar.classList.toggle('open');
            mainContent.classList.toggle('sidebar-open');
        }
    };
}

// Function to initialize dark mode toggle
function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // Check if dark mode is enabled in localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    // Set initial state
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Toggle dark mode when the switch is clicked
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    });
}

// Function to initialize clear conversations button
function initClearConversations() {
    // Use a more specific selector that targets the Clear All Chats text
    const clearChatsBtn = document.querySelector('.setting-item i.fa-trash').parentElement;

    clearChatsBtn.addEventListener('click', () => {
        showChatDeletionModal();
    });
}

// Function to initialize Manage API button
function initManageAPI() {
    const manageAPIBtn = document.getElementById('manage-api-btn');

    manageAPIBtn.addEventListener('click', () => {
        storeApiKey();
    });
}

// Function to initialize user profile section and modal
function initUserProfile() {
    const profileSection = document.querySelector('.profile-section');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');

    const savedProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const userName = savedProfile.name || 'User Profile';
    const userEmail = savedProfile.email || 'Click to set profile';

    if (profileName) {
        profileName.textContent = userName;
    }

    if (profileEmail) {
        profileEmail.textContent = userEmail;
    }

    if (profileSection) {
        profileSection.addEventListener('click', showProfileModal);
    }
}

function showProfileModal() {
    let profileModal = document.getElementById('profile-modal');

    if (!profileModal) {
        profileModal = document.createElement('div');
        profileModal.id = 'profile-modal';
        profileModal.className = 'modal';

        profileModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" id="close-profile-modal">&times;</span>
                <h2><i class="fas fa-user"></i> Update Profile</h2>
                <div class="modal-divider"></div>
                <div class="modal-body">
                    <div class="api-key-input-container">
                        <p class="modal-instruction">Name</p>
                        <input type="text" id="profile-name-input" class="full-width-input" placeholder="Your name">
                    </div>
                    <div class="api-key-input-container">
                        <p class="modal-instruction">Email (optional)</p>
                        <input type="email" id="profile-email-input" class="full-width-input" placeholder="you@example.com">
                    </div>
                    <div class="modal-divider"></div>
                    <div class="store-key-actions">
                        <button id="cancel-profile" class="secondary-button">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button id="save-profile" class="primary-button">
                            <i class="fas fa-save"></i> Save Profile
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(profileModal);

        document.getElementById('close-profile-modal').addEventListener('click', () => {
            profileModal.style.display = 'none';
        });

        document.getElementById('cancel-profile').addEventListener('click', () => {
            profileModal.style.display = 'none';
        });

        document.getElementById('save-profile').addEventListener('click', () => {
            const nameInput = document.getElementById('profile-name-input').value.trim();
            const emailInput = document.getElementById('profile-email-input').value.trim();

            if (!nameInput) {
                showToast('Please enter your name');
                return;
            }

            localStorage.setItem('user_profile', JSON.stringify({
                name: nameInput,
                email: emailInput
            }));

            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');

            if (profileName) {
                profileName.textContent = nameInput;
            }

            if (profileEmail) {
                profileEmail.textContent = emailInput || 'No email added';
            }

            profileModal.style.display = 'none';
            showToast('Profile updated');
        });

        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
    }

    const savedProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    document.getElementById('profile-name-input').value = savedProfile.name || '';
    document.getElementById('profile-email-input').value = savedProfile.email || '';

    profileModal.style.display = 'flex';
}

// Function to initialize about modal
function initAboutModal() {
    // Use a more specific selector that targets the About App text
    const aboutBtn = document.querySelector('.setting-item i.fa-info-circle').parentElement;
    const modal = document.getElementById('about-modal');
    const closeModal = document.querySelector('.close-modal');

    aboutBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Function to initialize emoji picker
function initEmojiPicker() {
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const emojiBtns = document.querySelectorAll('.emoji-btn');

    emojiBtn.addEventListener('click', () => {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'flex' : 'none';
    });

    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.textContent;
            const messageInput = document.getElementById('message-input');
            messageInput.value += emoji;
            messageInput.focus();
            emojiPicker.style.display = 'none';
        });
    });

    // Close emoji picker when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (emojiPicker.style.display !== 'none' &&
            !emojiPicker.contains(e.target) &&
            e.target !== emojiBtn) {
            emojiPicker.style.display = 'none';
        }
    });
}

// Function to initialize voice input
function initVoiceInput() {
    const voiceBtn = document.getElementById('voice-input-btn');

    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let isRecording = false;

        voiceBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
                voiceBtn.classList.remove('recording');
                isRecording = false;
            } else {
                recognition.start();
                voiceBtn.classList.add('recording');
                isRecording = true;
            }
        });

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            document.getElementById('message-input').value = transcript;
        };

        recognition.onend = () => {
            voiceBtn.classList.remove('recording');
            isRecording = false;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            voiceBtn.classList.remove('recording');
            isRecording = false;
        };
    } else {
        // Hide button if speech recognition is not supported
        voiceBtn.style.display = 'none';
    }
}

// Function to handle API key setup
function setupApiKey() {
    storeApiKey();
    return false;
}

function getProviderStorageKey(provider) {
    const normalizedProvider = provider || 'openrouter';

    if (normalizedProvider === 'huggingface') {
        return 'huggingface_api_key';
    }

    if (normalizedProvider === 'deepseek') {
        return 'deepseek_api_key';
    }

    if (normalizedProvider === 'grok') {
        return 'grok_api_key';
    }

    return 'openrouter_api_key';
}

function getProviderWindowKey(provider) {
    const normalizedProvider = provider || 'openrouter';

    if (normalizedProvider === 'huggingface') {
        return 'HUGGINGFACE_API_KEY';
    }

    if (normalizedProvider === 'deepseek') {
        return 'DEEPSEEK_API_KEY';
    }

    if (normalizedProvider === 'grok') {
        return 'GROK_API_KEY';
    }

    return 'OPENROUTER_API_KEY';
}

window.resolveProviderApiKey = function (provider, modelId = null) {
    if (modelId) {
        const modelSpecificKey = localStorage.getItem(`model_specific_key_${modelId}`);
        if (modelSpecificKey) {
            return modelSpecificKey;
        }
    }

    const storageKey = getProviderStorageKey(provider);
    const windowKey = getProviderWindowKey(provider);

    const directKey = window[windowKey] || localStorage.getItem(storageKey);
    if (directKey && directKey.trim()) {
        return directKey;
    }

    const storedKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');
    const fallback = storedKeys.find(k => k.provider === (provider || 'openrouter') && k.key && k.key.trim());

    if (fallback) {
        localStorage.setItem(storageKey, fallback.key);
        window[windowKey] = fallback.key;
        return fallback.key;
    }

    return '';
};

function hydrateProviderKeysFromStorage() {
    ['openrouter', 'deepseek', 'huggingface', 'grok'].forEach(provider => {
        const key = window.resolveProviderApiKey(provider);
        if (key) {
            const windowKey = getProviderWindowKey(provider);
            const storageKey = getProviderStorageKey(provider);
            window[windowKey] = key;
            localStorage.setItem(storageKey, key);
        }
    });
}

// Function to store and manage API keys
function storeApiKey() {
    // Create a modal for storing API key
    let storeKeyModal = document.getElementById('store-key-modal');

    if (!storeKeyModal) {
        storeKeyModal = document.createElement('div');
        storeKeyModal.id = 'store-key-modal';
        storeKeyModal.className = 'modal';

        storeKeyModal.innerHTML = `
            <div class="modal-content store-key-content">
                <span class="close-modal" id="close-store-modal">&times;</span>
                <h2><i class="fas fa-key"></i> Manage API Keys</h2>
                <div class="modal-divider"></div>
                
                <div class="tabs">
                    <div class="tab active" data-tab="add-key">Add New Key</div>
                    <div class="tab" data-tab="manage-keys">Manage Keys</div>
                </div>
                
                <div class="tab-content active" id="add-key-tab">
                    <div class="modal-body">
                        <div class="api-provider-selector">
                            <p class="modal-instruction">Select API Provider:</p>
                            <select class="provider-dropdown" id="api-provider-select">
                                <option value="openrouter">OpenRouter</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="huggingface">Hugging Face</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="openai">OpenAI</option>
                                <option value="grok">Grok</option>
                                <option value="other">Other Provider</option>
                            </select>
                        </div>
                        
                        <div class="api-key-input-container">
                            <p class="modal-instruction">Enter a name for this API key:</p>
                            <input type="text" id="api-key-name-input" placeholder="e.g. OpenRouter, DeepSeek" class="full-width-input">
                        </div>
                        
                        <div class="api-key-input-container">
                            <p class="modal-instruction">Paste your API key below:</p>
                            <input type="text" id="store-api-key-input" placeholder="Paste your API key here" class="full-width-input">
                            <div class="input-hint">Your API key will be stored in your browser's local storage</div>
                        </div>
                        
                        <div class="modal-divider"></div>
                        
                        <div class="store-key-actions">
                            <button id="cancel-store-api-key" class="secondary-button">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button id="save-store-api-key" class="primary-button">
                                <i class="fas fa-save"></i> Save Key
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="tab-content" id="manage-keys-tab">
                    <div class="modal-body">
                        <div class="stored-keys-container" id="stored-keys-list">
                            <!-- Stored keys will be displayed here -->
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <p class="api-key-note"><i class="fas fa-info-circle"></i> You can get an API key from <a href="https://openrouter.ai" target="_blank">OpenRouter.ai</a></p>
                </div>
            </div>
        `;

        document.body.appendChild(storeKeyModal);

        // Add event listeners for the new modal
        document.getElementById('close-store-modal').addEventListener('click', () => {
            storeKeyModal.style.display = 'none';
        });

        // Update API provider link when dropdown changes
        document.getElementById('api-provider-select').addEventListener('change', (e) => {
            const provider = e.target.value;
            const noteElement = document.querySelector('.api-key-note');

            // Change the provider link and text based on selection
            switch (provider) {
                case 'openrouter':
                    noteElement.innerHTML = '<i class="fas fa-info-circle"></i> You can get an API key from <a href="https://openrouter.ai" target="_blank">OpenRouter.ai</a>';
                    break;
                case 'deepseek':
                    noteElement.innerHTML = '<i class="fas fa-info-circle"></i> You can get an API key from <a href="https://platform.deepseek.com" target="_blank">DeepSeek Platform</a>';
                    break;
                case 'huggingface':
                    noteElement.innerHTML = '<i class="fas fa-info-circle"></i> You can get an API key from <a href="https://huggingface.co/settings/tokens" target="_blank">Hugging Face</a>';
                    break;
                case 'anthropic':
                    noteElement.innerHTML = '<i class="fas fa-info-circle"></i> You can get an API key from <a href="https://console.anthropic.com" target="_blank">Anthropic Console</a>';
                    break;
                case 'openai':
                    noteElement.innerHTML = '<i class="fas fa-info-circle"></i> You can get an API key from <a href="https://platform.openai.com" target="_blank">OpenAI Platform</a>';
                    break;
                case 'grok':
                    noteElement.innerHTML = '<i class="fas fa-info-circle"></i> You can get an API key from <a href="https://grok.x.ai" target="_blank">Grok AI</a>';
                    break;
                default:
                    noteElement.innerHTML = '<i class="fas fa-info-circle"></i> Enter your API key from your provider';
            }

            // Auto-fill the name field if empty
            const nameField = document.getElementById('api-key-name-input');
            if (!nameField.value.trim()) {
                const providerName = e.target.options[e.target.selectedIndex].text;
                nameField.value = providerName;
            }
        });

        document.getElementById('save-store-api-key').addEventListener('click', () => {
            const newApiKey = document.getElementById('store-api-key-input').value.trim();
            const keyName = document.getElementById('api-key-name-input').value.trim() || 'Unnamed Key';
            const provider = document.getElementById('api-provider-select').value;

            if (newApiKey) {
                // Get existing keys
                let storedKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');

                // Add new key
                storedKeys.push({
                    name: keyName,
                    key: newApiKey,
                    provider: provider,
                    date: new Date().toISOString()
                });

                // Save back to localStorage
                localStorage.setItem('stored_api_keys', JSON.stringify(storedKeys));

                // Set as default key for its provider
                if (provider === 'huggingface') {
                    localStorage.setItem('huggingface_api_key', newApiKey);
                    window.HUGGINGFACE_API_KEY = newApiKey;
                } else if (provider === 'deepseek') {
                    localStorage.setItem('deepseek_api_key', newApiKey);
                    window.DEEPSEEK_API_KEY = newApiKey;
                } else if (provider === 'grok') {
                    localStorage.setItem('grok_api_key', newApiKey);
                    window.GROK_API_KEY = newApiKey;
                } else {
                    // Default to OpenRouter
                    localStorage.setItem('openrouter_api_key', newApiKey);
                    window.OPENROUTER_API_KEY = newApiKey;
                }

                // Close modal and show success message
                storeKeyModal.style.display = 'none';
                showToast(`API key "${keyName}" stored successfully`);

                // Update manager tab if open
                updateStoredKeysDisplay();
            } else {
                // Highlight the input field with an error state
                const inputField = document.getElementById('store-api-key-input');
                inputField.classList.add('input-error');
                inputField.addEventListener('input', () => {
                    inputField.classList.remove('input-error');
                }, { once: true });

                showToast('Please enter a valid API key');
            }
        });

        document.getElementById('cancel-store-api-key').addEventListener('click', () => {
            storeKeyModal.style.display = 'none';
        });

        // Close modal when clicking outside
        storeKeyModal.addEventListener('click', (e) => {
            if (e.target === storeKeyModal) {
                storeKeyModal.style.display = 'none';
            }
        });

        // Set up tab switching
        const tabs = storeKeyModal.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                storeKeyModal.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                storeKeyModal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                storeKeyModal.querySelector(`#${tabId}-tab`).classList.add('active');

                // If switching to manage keys tab, update the display
                if (tabId === 'manage-keys') {
                    updateStoredKeysDisplay();
                }
            });
        });

        // Function to update the stored keys display
        window.updateStoredKeysDisplay = function () {
            const keysList = document.getElementById('stored-keys-list');
            const storedKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');

            if (storedKeys.length === 0) {
                keysList.innerHTML = `<div class="empty-keys-msg">No API keys stored yet.</div>`;
                return;
            }

            let keysHTML = '';
            storedKeys.forEach((keyObj, index) => {
                // Mask the API key for display
                const safeKey = keyObj.key || '';
                const maskedKey = safeKey.length > 10
                    ? safeKey.substring(0, 5) + '...' + safeKey.substring(safeKey.length - 5)
                    : '••••••••••';

                // Check if this key is currently active based on its provider
                const providerStorageKey = getProviderStorageKey(keyObj.provider || 'openrouter');
                const activeProviderKey = localStorage.getItem(providerStorageKey);
                const isActive = Boolean(activeProviderKey && keyObj.key === activeProviderKey);

                // Get provider icon
                const providerIcon = getProviderIcon(keyObj.provider || 'other');

                // Format date if available
                const dateString = keyObj.date ? new Date(keyObj.date).toLocaleDateString() : 'N/A';

                keysHTML += `
                    <div class="stored-key-item ${isActive ? 'active-key' : ''}">
                        <div class="key-info">
                            <span class="key-name">${providerIcon} ${keyObj.name}</span>
                            <span class="key-value">${maskedKey}</span>
                        </div>
                        <div class="stored-key-actions">
                            <button class="key-action-btn apply-key-btn" data-index="${index}">
                                Apply To Models
                            </button>
                            <button class="key-action-btn delete-key-btn" data-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            keysList.innerHTML = keysHTML;

            // Add event listeners for Apply buttons
            document.querySelectorAll('.apply-key-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    showModelSelectionForKey(index);
                });
            });

            // Add event listeners for Delete buttons
            document.querySelectorAll('.delete-key-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    deleteStoredKey(index);
                });
            });
        };

        // Function to delete a stored API key
        window.deleteStoredKey = function (keyIndex) {
            const storedKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');
            if (keyIndex < 0 || keyIndex >= storedKeys.length) return;

            const keyToDelete = storedKeys[keyIndex];

            // Confirm deletion
            if (confirm(`Are you sure you want to delete the key "${keyToDelete.name}"?`)) {
                const providerStorageKey = getProviderStorageKey(keyToDelete.provider || 'openrouter');
                const providerWindowKey = getProviderWindowKey(keyToDelete.provider || 'openrouter');
                const wasDefault = localStorage.getItem(providerStorageKey) === keyToDelete.key;

                // Remove key from storage
                storedKeys.splice(keyIndex, 1);
                localStorage.setItem('stored_api_keys', JSON.stringify(storedKeys));

                // Remove any model-specific assignments of this key
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('model_specific_key_') &&
                        localStorage.getItem(key) === keyToDelete.key) {
                        localStorage.removeItem(key);
                    }
                });

                if (wasDefault) {
                    localStorage.removeItem(providerStorageKey);
                    window[providerWindowKey] = '';

                    const replacementKey = window.resolveProviderApiKey(keyToDelete.provider || 'openrouter');
                    if (replacementKey) {
                        localStorage.setItem(providerStorageKey, replacementKey);
                        window[providerWindowKey] = replacementKey;
                    }
                }

                // Update the display
                updateStoredKeysDisplay();

                // Show toast message
                if (wasDefault) {
                    showToast(`Deleted default API key "${keyToDelete.name}"`);
                } else {
                    showToast(`Deleted API key "${keyToDelete.name}"`);
                }
            }
        };

        // Function to show model selection modal for applying key
        window.showModelSelectionForKey = function (keyIndex) {
            const storedKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');
            if (keyIndex < 0 || keyIndex >= storedKeys.length) return;

            const keyToApply = storedKeys[keyIndex];

            // Create modal for model selection
            let modelSelectionModal = document.getElementById('model-selection-modal');

            if (!modelSelectionModal) {
                modelSelectionModal = document.createElement('div');
                modelSelectionModal.id = 'model-selection-modal';
                modelSelectionModal.className = 'modal';

                modelSelectionModal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal" id="close-model-selection-modal">&times;</span>
                        <h2><i class="fas fa-key"></i> Apply API Key to Models</h2>
                        <div class="modal-divider"></div>
                        
                        <div class="modal-body">
                            <p class="modal-instruction">
                                Select which models should use <span class="highlighted-key-name"></span>:
                            </p>
                            <div class="select-actions">
                                <button id="select-all-models" class="secondary-button">
                                    <i class="fas fa-check-double"></i> Select All
                                </button>
                                <button id="deselect-all-models" class="secondary-button">
                                    <i class="fas fa-times-circle"></i> Deselect All
                                </button>
                            </div>
                            <div class="models-list-container two-column-grid" id="models-selection-list">
                                <!-- Models will be added here -->
                            </div>
                            
                            <div class="modal-divider"></div>
                            
                            <div class="model-selection-actions">
                                <button id="apply-to-selected-models" class="primary-button">
                                    <i class="fas fa-check"></i> Apply to Selected
                                </button>
                                <button id="apply-to-all-models" class="secondary-button">
                                    <i class="fas fa-globe"></i> Apply as Default
                                </button>
                                <button id="cancel-model-selection" class="secondary-button">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(modelSelectionModal);

                // Add event listeners
                document.getElementById('close-model-selection-modal').addEventListener('click', () => {
                    modelSelectionModal.style.display = 'none';
                });

                document.getElementById('cancel-model-selection').addEventListener('click', () => {
                    modelSelectionModal.style.display = 'none';
                });

                // Select all models
                document.getElementById('select-all-models').addEventListener('click', () => {
                    document.querySelectorAll('.model-checkbox').forEach(checkbox => {
                        checkbox.checked = true;
                    });
                });

                // Deselect all models
                document.getElementById('deselect-all-models').addEventListener('click', () => {
                    document.querySelectorAll('.model-checkbox').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                });

                // Apply to selected models
                document.getElementById('apply-to-selected-models').addEventListener('click', () => {
                    const selectedModels = document.querySelectorAll('.model-checkbox:checked');
                    const modelIds = Array.from(selectedModels).map(checkbox => checkbox.value);

                    if (modelIds.length === 0) {
                        showToast('No models selected');
                        return;
                    }

                    // Get the key index from the dataset
                    const keyIndex = parseInt(modelSelectionModal.dataset.keyIndex);
                    applyKeyToSelectedModels(keyIndex, modelIds);
                    modelSelectionModal.style.display = 'none';
                });

                // Apply as default for provider
                document.getElementById('apply-to-all-models').addEventListener('click', () => {
                    const keyIndex = parseInt(modelSelectionModal.dataset.keyIndex);
                    applyStoredKey(keyIndex);
                    modelSelectionModal.style.display = 'none';
                });

                // Close when clicking outside
                modelSelectionModal.addEventListener('click', (e) => {
                    if (e.target === modelSelectionModal) {
                        modelSelectionModal.style.display = 'none';
                    }
                });
            }

            // Set active key
            modelSelectionModal.dataset.keyIndex = keyIndex;
            document.querySelector('.highlighted-key-name').textContent = keyToApply.name;

            // Populate the models list
            populateModelSelectionList(keyToApply);

            // Show the modal
            modelSelectionModal.style.display = 'flex';
        };

        // Function to populate the model selection list
        window.populateModelSelectionList = function (keyObj) {
            const modelsContainer = document.getElementById('models-selection-list');
            let modelsHTML = '';

            availableModels.forEach(model => {
                // Check if model already uses this specific key
                const modelSpecificKey = localStorage.getItem(`model_specific_key_${model.id}`);
                const isActive = modelSpecificKey === keyObj.key;

                // Only show relevant models for this key type
                let shouldShow = true;
                if (keyObj.provider === 'huggingface' && model.provider !== 'huggingface') {
                    shouldShow = false;
                } else if (keyObj.provider === 'deepseek' && model.provider !== 'deepseek') {
                    shouldShow = false;
                } else if (keyObj.provider === 'grok' && model.provider !== 'grok') {
                    shouldShow = false;
                }

                if (shouldShow) {
                    modelsHTML += `
                        <div class="model-selection-item ${isActive ? 'active-model' : ''}">
                            <input type="checkbox" id="model-${model.id}" value="${model.id}" 
                                class="model-checkbox" ${isActive ? 'checked' : ''}>
                            <label for="model-${model.id}">
                                <div class="model-info">
                                    <div class="model-name">
                                        <i class="fas ${model.avatar}"></i> ${model.name}
                                    </div>
                                    <div class="model-provider">${model.provider}</div>
                                </div>
                            </label>
                        </div>
                    `;
                }
            });

            if (modelsHTML === '') {
                modelsHTML = `<p class="empty-models-msg">No compatible models found for this API key type.</p>`;
            }

            modelsContainer.innerHTML = modelsHTML;
        };

        // Function to apply key to specific models
        window.applyKeyToSelectedModels = function (keyIndex, modelIds) {
            const storedKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');
            if (keyIndex < 0 || keyIndex >= storedKeys.length) return;

            const keyToApply = storedKeys[keyIndex];

            // Apply the key to each selected model
            modelIds.forEach(modelId => {
                localStorage.setItem(`model_specific_key_${modelId}`, keyToApply.key);
            });

            showToast(`Applied ${keyToApply.name} to ${modelIds.length} model(s)`);
        };

        // Function to apply stored key as default for its provider
        window.applyStoredKey = function (keyIndex) {
            const storedKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');
            if (keyIndex < 0 || keyIndex >= storedKeys.length) return;

            const keyToApply = storedKeys[keyIndex];

            // Set as default key for its provider
            if (keyToApply.provider === 'huggingface') {
                localStorage.setItem('huggingface_api_key', keyToApply.key);
                window.HUGGINGFACE_API_KEY = keyToApply.key;
            } else if (keyToApply.provider === 'deepseek') {
                localStorage.setItem('deepseek_api_key', keyToApply.key);
                window.DEEPSEEK_API_KEY = keyToApply.key;
            } else if (keyToApply.provider === 'grok') {
                localStorage.setItem('grok_api_key', keyToApply.key);
                window.GROK_API_KEY = keyToApply.key;
            } else {
                // Default to OpenRouter
                localStorage.setItem('openrouter_api_key', keyToApply.key);
                window.OPENROUTER_API_KEY = keyToApply.key;
            }

            // Update the stored keys display to reflect the change
            updateStoredKeysDisplay();

            showToast(`Set ${keyToApply.name} as default for ${keyToApply.provider} models`);
        };

        // Function to get provider icon
        function getProviderIcon(provider) {
            const icons = {
                'openrouter': '<i class="fas fa-network-wired"></i>',
                'deepseek': '<i class="fas fa-brain"></i>',
                'huggingface': '<i class="fas fa-image"></i>',
                'anthropic': '<i class="fas fa-lightbulb"></i>',
                'openai': '<i class="fas fa-robot"></i>',
                'grok': '<i class="fas fa-bolt"></i>',
                'other': '<i class="fas fa-key"></i>'
            };
            return icons[provider] || icons.other;
        }
    }

    // Show the 'Manage Keys' tab by default
    const manageTab = storeKeyModal.querySelector('.tab[data-tab="manage-keys"]');
    manageTab.click();

    // Show the modal
    storeKeyModal.style.display = 'flex';
}

// Function to show toast notification
function showToast(message) {
    // Check if toast container exists
    let toastContainer = document.getElementById('toast-container');

    if (!toastContainer) {
        // Create toast container if it doesn't exist
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

// Function to import predefined API keys provided by the user
function importPredefinedAPIKeys() {
    const existingKeys = JSON.parse(localStorage.getItem('stored_api_keys') || '[]');
    if (!Array.isArray(existingKeys) || existingKeys.length === 0) {
        return;
    }

    const validKeys = existingKeys.filter(keyObj =>
        keyObj && typeof keyObj.key === 'string' && keyObj.key.trim()
    );

    if (validKeys.length !== existingKeys.length) {
        localStorage.setItem('stored_api_keys', JSON.stringify(validKeys));
    }

    hydrateProviderKeysFromStorage();
}

// Function to show chat deletion modal
function showChatDeletionModal() {
    // Create modal for deleting specific chats
    let deletionModal = document.getElementById('chat-deletion-modal');

    if (!deletionModal) {
        deletionModal = document.createElement('div');
        deletionModal.id = 'chat-deletion-modal';
        deletionModal.className = 'modal';

        deletionModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" id="close-deletion-modal">&times;</span>
                <h2><i class="fas fa-trash"></i> Delete Conversations</h2>
                <div class="modal-divider"></div>
                
                <div class="modal-body">
                    <p class="modal-instruction">Select conversations to delete:</p>
                    <div class="chat-list-container" id="deletion-chat-list">
                        <!-- Chat list will be added here -->
                    </div>
                    
                    <div class="modal-divider"></div>
                    
                    <div class="deletion-actions">
                        <button id="delete-selected-chats" class="primary-button">
                            <i class="fas fa-trash"></i> Delete Selected
                        </button>
                        <button id="delete-all-chats" class="danger-button">
                            <i class="fas fa-trash-alt"></i> Delete All
                        </button>
                        <button id="cancel-deletion" class="secondary-button">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(deletionModal);

        // Add event listeners
        document.getElementById('close-deletion-modal').addEventListener('click', () => {
            deletionModal.style.display = 'none';
        });

        document.getElementById('cancel-deletion').addEventListener('click', () => {
            deletionModal.style.display = 'none';
        });

        document.getElementById('delete-selected-chats').addEventListener('click', () => {
            const selectedChats = document.querySelectorAll('.chat-deletion-item input:checked');
            const chatIds = Array.from(selectedChats).map(checkbox => checkbox.value);

            if (chatIds.length === 0) {
                showToast('No conversations selected');
                return;
            }

            deleteSelectedConversations(chatIds);
            deletionModal.style.display = 'none';
        });

        document.getElementById('delete-all-chats').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL conversations? This action cannot be undone.')) {
                clearAllConversations();
                deletionModal.style.display = 'none';
            }
        });

        // Close when clicking outside
        deletionModal.addEventListener('click', (e) => {
            if (e.target === deletionModal) {
                deletionModal.style.display = 'none';
            }
        });
    }

    // Populate the chat list
    populateChatDeletionList();

    // Show the modal
    deletionModal.style.display = 'flex';
}

// Function to populate the chat deletion list
function populateChatDeletionList() {
    const chatListContainer = document.getElementById('deletion-chat-list');
    const keys = Object.keys(localStorage).filter(key => key.startsWith('chat_'));

    if (keys.length === 0) {
        chatListContainer.innerHTML = '<p class="empty-chats-msg">No conversations to delete.</p>';
        return;
    }

    let chatListHTML = '';

    keys.forEach(key => {
        const modelId = key.replace('chat_', '');
        const model = availableModels.find(m => m.id === modelId);

        if (model) {
            const isCurrentChat = currentModel && currentModel.id === modelId;
            const messages = JSON.parse(localStorage.getItem(key)) || [];
            const lastMessage = messages.length > 0 ?
                messages[messages.length - 1].content : 'Empty conversation';

            // Truncate last message if too long
            const truncatedMessage = lastMessage.length > 60 ?
                lastMessage.substring(0, 60) + '...' : lastMessage;

            chatListHTML += `
                <div class="chat-deletion-item ${isCurrentChat ? 'current-chat' : ''}">
                    <input type="checkbox" id="chat-${modelId}" value="${key}" class="chat-checkbox">
                    <label for="chat-${modelId}">
                        <div class="chat-info">
                            <span class="chat-model-name">
                                <i class="fas ${model.avatar}"></i> ${model.name}
                            </span>
                            <span class="chat-last-message">${truncatedMessage}</span>
                        </div>
                    </label>
                </div>
            `;
        }
    });

    chatListContainer.innerHTML = chatListHTML;
}

// Function to delete selected conversations
function deleteSelectedConversations(chatKeys) {
    if (!chatKeys || chatKeys.length === 0) return;

    chatKeys.forEach(key => {
        localStorage.removeItem(key);

        // If this was the current conversation, go back to model selection
        if (currentModel && `chat_${currentModel.id}` === key) {
            backToModelSelection();
        }
    });

    // Update the conversation history in the sidebar
    updateConversationHistory();

    // Show success toast
    showToast(`${chatKeys.length} conversation(s) deleted`);
} 