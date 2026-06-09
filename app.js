// State Management
let chats = [];
let activeChatId = null;
let currentTheme = 'dark';
let bgOpacity = 85;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const newChatBtn = document.getElementById('new-chat-btn');
const chatList = document.getElementById('chat-list');
const chatMessages = document.getElementById('chat-messages');
const messagesList = document.getElementById('messages-list');
const onboarding = document.getElementById('onboarding');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatTitle = document.getElementById('chat-title');
const clearChatBtn = document.getElementById('clear-chat-btn');
const shareBtn = document.getElementById('share-btn');
const settingsBtn = document.getElementById('settings-btn');
const typingIndicator = document.getElementById('typing-indicator');

// Settings DOM Elements
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const themeDarkBtn = document.getElementById('theme-dark-btn');
const themeLightBtn = document.getElementById('theme-light-btn');
const bgOpacitySlider = document.getElementById('bg-opacity-slider');
const opacityValueLabel = document.getElementById('opacity-value');

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    loadChatsFromStorage();
    loadSettingsFromStorage();
    setupEventListeners();
    renderChatList();
    applySettings();
    
    if (activeChatId) {
        loadChat(activeChatId);
    } else {
        showOnboarding();
    }
    
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Load chats from LocalStorage
function loadChatsFromStorage() {
    const storedChats = localStorage.getItem('kcr_nexus_chats');
    const storedActiveId = localStorage.getItem('kcr_nexus_active_id');
    
    if (storedChats) {
        try {
            chats = JSON.parse(storedChats);
        } catch (e) {
            chats = [];
        }
    }
    
    if (storedActiveId && chats.some(c => c.id === storedActiveId)) {
        activeChatId = storedActiveId;
    }
}

// Save chats to LocalStorage
function saveChatsToStorage() {
    localStorage.setItem('kcr_nexus_chats', JSON.stringify(chats));
    localStorage.setItem('kcr_nexus_active_id', activeChatId);
}

// Setup Event Listeners
function setupEventListeners() {
    // Submit message form
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleMessageSubmit();
    });

    // Auto-resize textarea and handle Enter submit
    messageInput.addEventListener('input', () => {
        autoResizeTextarea();
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.requestSubmit();
        }
    });

    // New Chat Button
    newChatBtn.addEventListener('click', () => {
        startNewChat();
    });

    // Clear Chat Button
    clearChatBtn.addEventListener('click', () => {
        if (activeChatId) {
            if (confirm('Tem certeza de que deseja apagar todas as mensagens desta conversa?')) {
                clearActiveChat();
            }
        }
    });

    // Sidebar Toggle for Mobile
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on tapping main chat area in mobile
    chatMessages.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // Open Settings Modal
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        sidebar.classList.remove('open');
    });

    // Close Settings Modal
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Close on overlay click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Theme Toggles
    themeDarkBtn.addEventListener('click', () => {
        currentTheme = 'dark';
        applySettings();
        saveSettingsToStorage();
    });

    themeLightBtn.addEventListener('click', () => {
        currentTheme = 'light';
        applySettings();
        saveSettingsToStorage();
    });

    // Background Opacity Control
    bgOpacitySlider.addEventListener('input', (e) => {
        bgOpacity = parseInt(e.target.value, 10);
        applySettings();
    });

    bgOpacitySlider.addEventListener('change', () => {
        saveSettingsToStorage();
    });

    // Share placeholder
    shareBtn.addEventListener('click', () => {
        if (activeChatId) {
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('Link de compartilhamento copiado para a área de transferência!'))
                .catch(() => alert('Erro ao copiar link.'));
        } else {
            alert('Inicie uma conversa para poder compartilhar.');
        }
    });
}

// Auto Resize Input Textarea
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
}

// Start New Chat State
function startNewChat() {
    activeChatId = null;
    showOnboarding();
    chatTitle.textContent = 'Nova conversa';
    messageInput.value = '';
    autoResizeTextarea();
    sidebar.classList.remove('open');
    messageInput.focus();
}

// Show onboarding screen
function showOnboarding() {
    onboarding.style.display = 'flex';
    messagesList.innerHTML = '';
    chatTitle.textContent = 'Nova conversa';
}

// Hide onboarding screen
function hideOnboarding() {
    onboarding.style.display = 'none';
}

// Load a specific chat
function loadChat(chatId) {
    activeChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    hideOnboarding();
    chatTitle.textContent = chat.title;
    
    // Render Messages
    messagesList.innerHTML = '';
    chat.messages.forEach(msg => {
        renderMessageBubble(msg.sender, msg.text);
    });
    
    scrollToBottom();
    saveChatsToStorage();
    renderChatList();
}

// Render message bubble to DOM
function renderMessageBubble(sender, text) {
    const row = document.createElement('div');
    row.classList.add('message-row', sender);
    
    // Bubble
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    
    // Text formatting (simple markdown code-block & line-breaks parsing)
    bubble.innerHTML = formatMessageText(text);
    
    // Avatar
    const avatar = document.createElement('div');
    avatar.classList.add(sender === 'bot' ? 'bot-avatar' : 'user-avatar');
    
    if (sender === 'bot') {
        avatar.innerHTML = `
            <svg viewBox="0 0 120 120" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 25 L95 45 L60 65 L25 45 Z" fill="url(#topGrad)" />
                <path d="M25 45 L60 65 L60 100 L25 80 Z" fill="url(#leftGrad)" />
                <path d="M60 65 L95 45 L95 80 L60 100 Z" fill="url(#rightGrad)" />
            </svg>
        `;
    } else {
        avatar.textContent = 'VK';
    }
    
    if (sender === 'bot') {
        row.appendChild(avatar);
        row.appendChild(bubble);
    } else {
        row.appendChild(bubble);
        row.appendChild(avatar);
    }
    
    messagesList.appendChild(row);
}

// Formats message text: handles linebreaks and code blocks
function formatMessageText(text) {
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    // Match markdown code blocks: ```javascript ... ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    escaped = escaped.replace(codeBlockRegex, (match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Replace linebreaks with <br> (only outside pre blocks)
    // A simple split and join handles typical chat formatting safely
    return escaped.split('\n').map((line) => {
        if (line.startsWith('<pre>') || line.startsWith('</pre>') || line.startsWith('<code') || line.startsWith('</code')) {
            return line;
        }
        return line;
    }).join('\n').replace(/\n/g, '<br>');
}

// Handle message submission
function handleMessageSubmit() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    // Create new chat if currently none active
    if (!activeChatId) {
        const newChat = {
            id: 'chat_' + Date.now(),
            title: text.substring(0, 24) + (text.length > 24 ? '...' : ''),
            messages: []
        };
        chats.unshift(newChat); // Put new chat at top
        activeChatId = newChat.id;
        hideOnboarding();
    }
    
    const currentChat = chats.find(c => c.id === activeChatId);
    if (!currentChat) return;
    
    // Add User Message
    const userMsg = { sender: 'user', text: text, timestamp: new Date().toISOString() };
    currentChat.messages.push(userMsg);
    renderMessageBubble('user', text);
    createSubmitExplosion();
    
    // Reset Input
    messageInput.value = '';
    autoResizeTextarea();
    scrollToBottom();
    
    // Save state
    saveChatsToStorage();
    renderChatList();
    
    // Show Typing Indicator
    showTypingIndicator();
    
    // Generate Smart Mock Response
    setTimeout(() => {
        const botResponseText = getSmartBotResponse(text);
        hideTypingIndicator();
        
        const botMsg = { sender: 'bot', text: botResponseText, timestamp: new Date().toISOString() };
        currentChat.messages.push(botMsg);
        
        renderMessageBubble('bot', botResponseText);
        scrollToBottom();
        
        saveChatsToStorage();
        renderChatList();
    }, 1200 + Math.random() * 600); // 1.2 to 1.8s delay
}

// Select a suggestion card
function selectSuggestion(suggestionText) {
    messageInput.value = suggestionText;
    autoResizeTextarea();
    messageInput.focus();
}
window.selectSuggestion = selectSuggestion;

// Smart Mock Bot Responses based on keywords
function getSmartBotResponse(userText) {
    const text = userText.toLowerCase();
    
    if (text.includes('quântica') || text.includes('fisica') || text.includes('física')) {
        return "A computação quântica baseia-se nos princípios da mecânica quântica, como superposição e emaranhamento:\n\n1. **Superposição:** Permite que qubits existam em 0, 1 ou ambos os estados ao mesmo tempo.\n2. **Emaranhamento:** Links quânticos entre partículas que aceleram o processamento.\n\nEnquanto computadores clássicos resolvem problemas sequencialmente, computadores quânticos exploram múltiplos caminhos simultaneamente!";
    }
    
    if (text.includes('fluxo') || text.includes('trabalho') || text.includes('otimizar') || text.includes('produtividade')) {
        return "Para otimizar o seu fluxo de trabalho, aqui estão 3 práticas essenciais:\n\n- **Automação:** Delegue tarefas repetitivas a scripts ou IAs.\n- **Método Pomodoro:** Divida o trabalho em blocos de foco de 25 minutos com pequenos intervalos.\n- **Organização Visual:** Utilize quadros Kanban (como Notion ou Trello) para mapear gargalos.";
    }
    
    if (text.includes('javascript') || text.includes('js') || text.includes('código') || text.includes('ordenar') || text.includes('função')) {
        return "Claro! Veja esta função Javascript limpa para ordenar um array de objetos com base em qualquer chave de forma dinâmica:\n\n```javascript\nfunction ordenarPorChave(array, chave) {\n  return [...array].sort((a, b) => {\n    if (a[chave] < b[chave]) return -1;\n    if (a[chave] > b[chave]) return 1;\n    return 0;\n  });\n}\n```\nVocê pode testar executando `ordenarPorChave(usuarios, 'nome')`. Ela retorna uma nova lista ordenada.";
    }

    if (text.includes('olá') || text.includes('oi') || text.includes('hello') || text.includes('bom dia') || text.includes('boa tarde')) {
        return "Olá! Eu sou o KCR Nexus. Como posso ajudar você a construir o futuro da tecnologia hoje?";
    }

    // Default pool of responsive lines
    const fallbacks = [
        "Entendi! Como o KCR Nexus é uma interface inteligente em desenvolvimento por Victor Kauê, essa resposta é um demonstrativo.\n\nEm breve, este painel será conectado a um agente cognitivo de IA ativo. O que achou do design do console?",
        "Muito interessante! A arquitetura do KCR Nexus está preparada para acoplar qualquer LLM moderno (como GPT-4, Claude ou Gemini) com histórico contextual local.",
        "Excelente ponto! Podemos estruturar o salvamento de histórico de conversas no banco de dados quando integrarmos o agente de IA definitivo. Por enquanto, seu histórico fica salvo no navegador!"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Typing Indicator Controls
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Scroll messages body to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Clear all messages in active chat
function clearActiveChat() {
    const chat = chats.find(c => c.id === activeChatId);
    if (chat) {
        chat.messages = [];
        showOnboarding();
        saveChatsToStorage();
        renderChatList();
    }
}

// Render the sidebar chat history
function renderChatList() {
    chatList.innerHTML = '';
    
    if (chats.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.style.padding = '12px';
        emptyState.style.fontSize = '12px';
        emptyState.style.color = 'var(--text-muted)';
        emptyState.style.textAlign = 'center';
        emptyState.textContent = 'Nenhuma conversa salva';
        chatList.appendChild(emptyState);
        return;
    }
    
    chats.forEach(chat => {
        const item = document.createElement('div');
        item.classList.add('chat-item');
        if (chat.id === activeChatId) {
            item.classList.add('active');
        }
        
        // Click to load chat
        item.addEventListener('click', (e) => {
            // Avoid triggering chat load if delete button is clicked
            if (e.target.closest('.chat-item-btn')) return;
            loadChat(chat.id);
            sidebar.classList.remove('open');
        });
        
        // Content wrapper
        const content = document.createElement('div');
        content.classList.add('chat-item-content');
        
        const chatIcon = document.createElement('i');
        chatIcon.setAttribute('data-lucide', 'message-square');
        chatIcon.style.width = '16px';
        chatIcon.style.height = '16px';
        
        const titleSpan = document.createElement('span');
        titleSpan.classList.add('chat-item-title');
        titleSpan.textContent = chat.title;
        
        content.appendChild(chatIcon);
        content.appendChild(titleSpan);
        
        // Actions
        const actions = document.createElement('div');
        actions.classList.add('chat-item-actions');
        
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('chat-item-btn');
        deleteBtn.setAttribute('title', 'Excluir conversa');
        
        const trashIcon = document.createElement('i');
        trashIcon.setAttribute('data-lucide', 'trash-2');
        trashIcon.style.width = '14px';
        trashIcon.style.height = '14px';
        
        deleteBtn.appendChild(trashIcon);
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        
        actions.appendChild(deleteBtn);
        
        item.appendChild(content);
        item.appendChild(actions);
        chatList.appendChild(item);
    });
    
    // Re-initialize dynamic Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Delete specific chat
function deleteChat(chatId) {
    chats = chats.filter(c => c.id !== chatId);
    
    if (activeChatId === chatId) {
        activeChatId = null;
        startNewChat();
    } else {
        saveChatsToStorage();
        renderChatList();
    }
}

// Load settings from storage
function loadSettingsFromStorage() {
    const storedTheme = localStorage.getItem('kcr_nexus_theme');
    const storedOpacity = localStorage.getItem('kcr_nexus_bg_opacity');
    
    if (storedTheme) currentTheme = storedTheme;
    if (storedOpacity) bgOpacity = parseInt(storedOpacity, 10);
}

// Save settings to storage
function saveSettingsToStorage() {
    localStorage.setItem('kcr_nexus_theme', currentTheme);
    localStorage.setItem('kcr_nexus_bg_opacity', bgOpacity.toString());
}

// Apply settings to DOM and CSS properties
function applySettings() {
    // Apply theme override
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        themeLightBtn.classList.add('active');
        themeDarkBtn.classList.remove('active');
    } else {
        document.body.classList.remove('light-theme');
        themeDarkBtn.classList.add('active');
        themeLightBtn.classList.remove('active');
    }
    
    // Apply background opacity variable
    document.documentElement.style.setProperty('--bg-canvas-opacity', (bgOpacity / 100).toString());
    bgOpacitySlider.value = bgOpacity;
    opacityValueLabel.textContent = `${bgOpacity}%`;
}

// Particle explosion when user clicks send
function createSubmitExplosion() {
    const btn = document.getElementById('send-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const container = document.body;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.classList.add('explosion-particle');
        
        // Size
        const size = Math.random() * 6 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Spawn at center of send button
        particle.style.left = `${rect.left + rect.width / 2}px`;
        particle.style.top = `${rect.top + rect.height / 2}px`;
        
        // Offset direction variables for CSS
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 80 + 40;
        const tx = Math.cos(angle) * speed;
        const ty = Math.sin(angle) * speed - 20; // Float slightly upwards
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        // Random color
        const isPurple = Math.random() > 0.5;
        particle.style.background = isPurple ? 'var(--color-purple)' : 'var(--color-blue)';
        particle.style.boxShadow = isPurple ? '0 0 10px var(--color-purple)' : '0 0 10px var(--color-blue)';
        
        container.appendChild(particle);
        
        // Clean up
        setTimeout(() => {
            particle.remove();
        }, 600);
    }
}

