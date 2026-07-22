let sessions = [];
let currentSessionId = null;
let active = false; 
let storedValue = "";
let counter = 1;

const image = document.getElementById('click-image');
const tempChat = document.getElementById('temp-image');
const historyElement = document.querySelector('.history');
const title = document.querySelector('.title');
const tglBtn = document.querySelector('.toggle-btn');
const chatHistory = document.getElementById('chat-history');
const newChatBtn = document.getElementById('new-chat-btn');

async function fetchSessionsFromDB() {
    try {
        const response = await fetch('/api/sessions');
        sessions = await response.json();
        renderSidebar();
    } catch (err) {
        console.error("Failed to load sessions from database:", err);
    }
}

function updateTemp() {
    if (tempChat) {
        if ((chatHistory && chatHistory.children.length > 0) || currentSessionId) {
            tempChat.style.display = "none";
            const session = sessions.find(s => s.id === currentSessionId);
            if (session) {
                const words = session.title.split(' ');
                const shortTitle = words.slice(0, 4).join(' ');
                const hasMoreWords = words.length > 4;
                const displayTitle = hasMoreWords ? `${shortTitle}...` : shortTitle;
                title.innerText = displayTitle;
                title.style.display = "block";
                document.title = displayTitle; 
            }
        } else {
            tempChat.style.display = "block";
            document.title = "AI-AGENT";
        }
    }
}

if (tempChat) {
    updateTemp();
    tempChat.addEventListener('click', function() {
        if (active === false) {
            if (title) title.innerText = "Temporary Chat";
            active = true;
        } else {
            if (title) title.innerText = "What’s on your mind today?";
            active = false;
        }
        updateTemp(); 
    });
}

const dropdownDarkModeBtn = document.getElementById('click-image-btn');
if (dropdownDarkModeBtn) {
    dropdownDarkModeBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeUI(isDark);
        document.getElementById("dropdown-menu").classList.remove("show");
    });
}

function updateThemeUI(isDark) {
    const themeText = document.getElementById('click-image-btn')?.querySelector('.theme-text');
    if (themeText) {
        themeText.textContent = isDark ? "Toggle Light Mode" : "Toggle Dark Mode";
    }
}

function renderSidebar() {
    if (!historyElement) return;
    historyElement.innerHTML = '';
    if (newChatBtn) {
        newChatBtn.classList.toggle('active', !currentSessionId);
    }

    sessions.forEach(session => {
        const item = document.createElement('div');
        item.className = session.id === currentSessionId ? 'chat-log-item active' : 'chat-log-item';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'item-title-span';
        const shortTitle = session.title.split(' ').slice(0, 4).join(' ');
        const hasMoreWords = session.title.split(' ').length > 4;
        titleSpan.textContent = hasMoreWords ? `${shortTitle}...` : shortTitle;

        item.onclick = (e) => {
            if (!e.target.closest('.item-menu-dots-btn') && !e.target.closest('.item-dropdown')) {
                loadSession(session.id);
                renderSidebar();
            }
        };

        const renameInput = document.createElement('input');
        renameInput.type = 'text';
        renameInput.className = 'item-rename-input hidden';
        renameInput.value = session.title;
        
        renameInput.onkeydown = async (e) => {
            if (e.key === 'Enter') {
                await saveInlineRename(session.id, renameInput.value);
                updateTemp();
            }
            if (e.key === 'Escape') {
                renderSidebar();
            }
        };
        renameInput.onblur = async () => {
            await saveInlineRename(session.id, renameInput.value);
        };
        renameInput.onclick = (e) => e.stopPropagation();

        const itemMenuBtn = document.createElement('button');
        itemMenuBtn.className = 'item-menu-dots-btn';
        itemMenuBtn.innerHTML = '•••';
        itemMenuBtn.onclick = (e) => {
            e.stopPropagation();
            toggleItemDropdown(e, session.id);
        };

        const itemDropdown = document.createElement('div');
        itemDropdown.className = 'item-dropdown hidden';
        itemDropdown.id = `item-dropdown-${session.id}`;

        const renameOpt = document.createElement('button');
        renameOpt.className = 'item-dropdown-btn';
        renameOpt.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Rename</span>
        `;
        renameOpt.onclick = (e) => {
            e.stopPropagation();
            startInlineRename(item, titleSpan, renameInput, itemMenuBtn);
        };

        const renameAI = document.createElement('button');
        renameAI.className = 'item-dropdown-btn';
        renameAI.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
            </svg>
            <span>Rename with AI</span>
        `;
        renameAI.onclick = async (e) => {
            e.stopPropagation();
            closeAllItemDropdowns();
            await startInAIRename(session.id, e.currentTarget);
        };

        const deleteOpt = document.createElement('button');
        deleteOpt.className = 'item-dropdown-btn item-delete-btn';
        deleteOpt.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>Delete</span>
        `;
        deleteOpt.onclick = async (e) => {
            e.stopPropagation();
            const check = confirm("Are you sure you want to delete this chat?");
            if (check) {
                await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' });
                sessions = sessions.filter(s => s.id !== session.id);
                if (currentSessionId === session.id) {
                    createNewChat();
                } else {
                    renderSidebar();
                }
            }
        };

        itemDropdown.appendChild(renameOpt);
        itemDropdown.appendChild(renameAI);
        itemDropdown.appendChild(deleteOpt);

        item.appendChild(titleSpan);
        item.appendChild(renameInput);
        item.appendChild(itemMenuBtn);
        item.appendChild(itemDropdown);
        
        historyElement.appendChild(item);
    });
}

async function startInAIRename(sessionId, btn) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    if (btn) btn.disabled = true;
    try {
        const response = await fetch('http://127.0.0.1:5000/api/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: session.messages })
        });

        const data = await response.json();
        if (data.title) {
            await saveInlineRename(sessionId, data.title);
            updateTemp();
        }
    } catch (error) {
        console.error("Failed to rename with AI:", error);
    } finally {
        if (btn) btn.disabled = false;
    }
}

function startInlineRename(itemRow, titleSpan, input, menuBtn) {
    closeAllItemDropdowns();
    titleSpan.classList.add('hidden');
    menuBtn.classList.add('hidden');
    input.classList.remove('hidden');
    input.focus();
    input.select();
}

async function saveInlineRename(sessionId, newTitle) {
    if (newTitle.trim() === '') {
        renderSidebar();
        return;
    }
    await fetch(`/api/sessions/${sessionId}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
    });
    sessions = sessions.map(session => {
        if (session.id === sessionId) {
            session.title = newTitle;
        }
        return session;
    });
    renderSidebar();
}

function toggleItemDropdown(event, sessionId) {
    event.stopPropagation();
    const settingsDropdown = document.getElementById("dropdown-menu");
    if (settingsDropdown) settingsDropdown.classList.remove("show");

    const currentItem = event.currentTarget.parentElement;
    const dropdown = currentItem.querySelector('.item-dropdown');
    if (!dropdown) return;

    currentItem.classList.remove('position-up');

    const rect = currentItem.getBoundingClientRect();
    const containerHeight = document.querySelector('.history').clientHeight;
    
    if (rect.top > containerHeight * 0.95) {
        currentItem.classList.add('position-up');
    }

    const isAlreadyOpen = !dropdown.classList.contains('hidden');
    closeAllItemDropdowns();
    if (!isAlreadyOpen) {
        dropdown.classList.remove('hidden');
    }
}

function closeAllItemDropdowns() {
    document.querySelectorAll('.item-dropdown').forEach(dropdown => {
        dropdown.classList.add('hidden');
    });
}

window.addEventListener('click', function(event) {
    if (!event.target.matches('.menu-dots-btn')) {
        const dropdown = document.getElementById("dropdown-menu");
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
    if (!event.target.matches('.item-menu-dots-btn')) {
        closeAllItemDropdowns();
    }
});

async function saveData(event) {
    if (event) event.preventDefault();
    const userInput = document.querySelector('.search');
    storedValue = userInput.value;

    if (storedValue.trim() === "") return;
    if (title) title.innerText = "";
    
    if (!currentSessionId && !active) {
        currentSessionId = "session_" + Date.now();
        const defaultTitle = storedValue.substring(0, 20);

        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentSessionId, title: defaultTitle })
        });

        sessions.unshift({ id: currentSessionId, title: defaultTitle, messages: [] });
        window.history.pushState({ sessionId: currentSessionId }, "", `/session/${currentSessionId}`);
        renderSidebar();
    }

    const currentSession = active ? null : sessions.find(s => s.id === currentSessionId); 
    const newMessage = document.createElement('div');
    newMessage.innerText = storedValue;
    newMessage.classList.add('message', 'user-message');
    chatHistory.appendChild(newMessage);

    updateTemp();

    if (currentSession) {
        const userMsg = { role: 'user', sender: 'user-message', text: storedValue };
        currentSession.messages.push(userMsg);

        await fetch(`/api/sessions/${currentSessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userMsg)
        });
        if (currentSession.messages.length === 1) {
            startInAIRename(currentSession.id, { disabled: false });
        }
    }

    userInput.value = "";
    userInput.style.height = "auto";
    if (micBtn && sendBtn) {
    micBtn.classList.remove("hidden");
    sendBtn.classList.add("hidden");
}
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const aiMessage = document.createElement('div');
    aiMessage.classList.add('message', 'ai-message');
    aiMessage.innerText = "Thinking...";
    chatHistory.appendChild(aiMessage);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        const response = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: storedValue,
                history: currentSession ? currentSession.messages : []
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        aiMessage.innerText = data.reply;

        if (currentSession) {
            const aiMsg = { role: 'model', sender: 'ai-message', text: data.reply };
            currentSession.messages.push(aiMsg);

            await fetch(`/api/sessions/${currentSessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiMsg)
            });
        }
    } catch (error) {
        console.error('Error:', error);
        aiMessage.innerText = "Error: Could not reach the server.";
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function loadSession(id) {
    const session = sessions.find(s => s.id === id);
    if (!session) return;

    const words = session.title.split(' ');
    const shortTitle = words.slice(0, 4).join(' ');
    const hasMoreWords = words.length > 4;
    const displayTitle = hasMoreWords ? `${shortTitle}...` : shortTitle;

    currentSessionId = id;
    active = false; 

    window.history.pushState({ sessionId: id }, "", `/session/${id}`);
    if (title) {
        title.innerText = displayTitle;
        title.style.display = "block"; 
    }

    chatHistory.innerHTML = '';

    session.messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', msg.sender);
        msgDiv.innerText = msg.text;
        chatHistory.appendChild(msgDiv);
    });

    updateTemp();
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function createNewChat() {
    if (tempChat) tempChat.style.display = "block";
    if (title) {
        title.style.display = "block";
        title.innerText = "What’s on your mind today?";
    }
    document.title = "AI-AGENT";

    window.history.pushState({}, "", "/");

    currentSessionId = null;
    active = false; 
    
    if (chatHistory) chatHistory.innerHTML = '';
    
    const inputField = document.querySelector(".search");
    if (inputField) inputField.value = "";
    
    updateTemp();
    renderSidebar();
}

function togglePanel() {
    const container = document.querySelector('.container');
    if (container) container.classList.toggle('panel-closed');
}

function toggleDropdown(event) {
    event.stopPropagation();
    closeAllItemDropdowns();
    const dropdown = document.getElementById("dropdown-menu");
    if (dropdown) dropdown.classList.toggle("show");
}

async function handleDelete() {
    if (chatHistory.children.length <= 0) return;
    const check = confirm("Are you sure you want to delete this chat?");
    if (!check) return;
    
    if (!currentSessionId) {
        if (chatHistory) chatHistory.innerHTML = '';
        updateTemp();
        return;
    }
    
    await fetch(`/api/sessions/${currentSessionId}`, { method: 'DELETE' });
    sessions = sessions.filter(session => session.id !== currentSessionId);
    renderSidebar();
    createNewChat();
}

const searchBox = document.querySelector(".search");
const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send-btn");

if (searchBox) {
    searchBox.addEventListener("input", () => {
        // Auto-expand textarea height
        searchBox.style.height = "auto";
        searchBox.style.height = searchBox.scrollHeight + "px";

        // Toggle Mic vs Send Button
        if (searchBox.value.trim().length > 0) {
            micBtn.classList.add("hidden");
            sendBtn.classList.remove("hidden");
        } else {
            micBtn.classList.remove("hidden");
            sendBtn.classList.add("hidden");
        }
    });
}
function InitializeChat() {
    const path = window.location.pathname;
    const pathSegments = path.split("/").filter(Boolean);
    
    if (pathSegments[0] === "session" && pathSegments[1]) {
        const urlSessionId = pathSegments[1];
        const matchingSession = sessions.find(s => s.id === urlSessionId);
        
        if (matchingSession) {
            loadSession(urlSessionId);
            renderSidebar();
        } else {
            createNewChat();
        }
    } else {
        createNewChat();
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeUI(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateThemeUI(false);
    }
    await fetchSessionsFromDB();
    InitializeChat();
});

window.addEventListener('popstate', InitializeChat);
window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.altKey && event.key === 'n') {
        event.preventDefault();
        createNewChat();
    }
});
// Add to the bottom of script.js

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

document.addEventListener('DOMContentLoaded', () => {
    const micBtn = document.getElementById('mic-btn');
    if (!micBtn) return;

    micBtn.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    await handleAudioSubmission(audioBlob);
                };

                mediaRecorder.start();
                isRecording = true;
                micBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                `;
            } catch (err) {
                console.error("Microphone access error:", err);
                alert("Could not access microphone.");
            }
        } else {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            isRecording = false;
            micBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
        </svg>
        `;
        }
    });
});

async function handleAudioSubmission(blob) {
    if (title) title.innerText = "";

    // 1. Manage Session creation if new chat
    if (!currentSessionId && !active) {
        currentSessionId = "session_" + Date.now();
        const defaultTitle = "Voice Message";

        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentSessionId, title: defaultTitle })
        });

        sessions.unshift({ id: currentSessionId, title: defaultTitle, messages: [] });
        window.history.pushState({ sessionId: currentSessionId }, "", `/session/${currentSessionId}`);
        renderSidebar();
    }

    const currentSession = active ? null : sessions.find(s => s.id === currentSessionId);

    // 2. Add placeholder user message & AI thinking message in UI
    const newMessage = document.createElement('div');
    newMessage.innerText = "Audio message sent...";
    newMessage.classList.add('message', 'user-message');
    chatHistory.appendChild(newMessage);

    const aiMessage = document.createElement('div');
    aiMessage.classList.add('message', 'ai-message');
    aiMessage.innerText = "Listening & Thinking...";
    chatHistory.appendChild(aiMessage);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 3. Prepare FormData & POST to Flask
    const formData = new FormData();
    formData.append('audio', blob, 'audio.webm');
    formData.append('history', JSON.stringify(currentSession ? currentSession.messages : []));

    try {
        const response = await fetch('/api/chat-audio', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Audio route error");
        const data = await response.json();
        if (data.transcription) {
            const formattedtext=`Audio: ${data.transcription}`;
            newMessage.innerText =formattedtext ;
            if (currentSession) {
                const userMsg = { role: 'user', sender: 'user-message', text:formattedtext};
                currentSession.messages.push(userMsg);
                await fetch(`/api/sessions/${currentSessionId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userMsg)
                });
            }
            
        }

        // Render AI Response
        aiMessage.innerText = data.reply;
        if (currentSession) {
            const aiMsg = { role: 'model', sender: 'ai-message', text: data.reply };
            currentSession.messages.push(aiMsg);
            await fetch(`/api/sessions/${currentSessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiMsg)
            });
            if (currentSession.messages.length === 2) {
                startInAIRename(currentSession.id, null);
            }
        }
    } catch (err) {
        console.error(err);
        aiMessage.innerText = "Error processing audio.";
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
}