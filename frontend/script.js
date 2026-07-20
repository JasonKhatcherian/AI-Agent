let sessions = JSON.parse(localStorage.getItem("chat_sessions")) || [];
let currentSessionId = null;
let active = false; 
let storedValue = "";
let counter=1;
const image = document.getElementById('click-image');
const tempChat = document.getElementById('temp-image');
const historyElement = document.querySelector('.history');
const title = document.querySelector('.title');
const tglBtn=document.querySelector('.toggle-btn');
const chatHistory = document.getElementById('chat-history');
const newChatBtn = document.getElementById('new-chat-btn');
function updateTemp() {
    if (tempChat) {
        if ((chatHistory && chatHistory.children.length > 0) || currentSessionId) {
            tempChat.style.display = "none";
            const session = sessions.find(s => s.id === currentSessionId);
            if(session){
            const words = session.title.split(' ');
            const shortTitle = words.slice(0, 4).join(' ');
            const hasMoreWords = words.length > 4;
            displayTitle = hasMoreWords ? `${shortTitle}...` : shortTitle;
            title.innerText = displayTitle;
            title.style.display = "block";
            document.title=displayTitle; 
}           }
    }else {
            tempChat.style.display = "block";
            document.title = "AI-AGENT";
        }
    
}

if (tempChat) {
    updateTemp();
}

if (tempChat) {
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
function updateThemeUI(isDark){
    const themeText = document.getElementById('click-image-btn').querySelector('.theme-text');
    if (themeText) {
        themeText.textContent = isDark ? "Toggle Light Mode" : "Toggle Dark Mode";
    }
}

function renderSidebar() {
    if (!historyElement) return;
    historyElement.innerHTML = '';
    if(newChatBtn){
        newChatBtn.classList.toggle('active', !currentSessionId);
    }
    sessions.forEach(session => {
        const item = document.createElement('div');
        if (session.id === currentSessionId) {
            item.className = 'chat-log-item active';
        } else {
            item.className = 'chat-log-item';
        }


        // item.dataset.id = session.id;

        // 1. Text display element
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'item-title-span';
        const shortTitle = session.title.split(' ').slice(0, 4).join(' ');
        const hasMoreWords = session.title.split(' ').length > 4;
        titleSpan.textContent = hasMoreWords ? `${shortTitle}...` : shortTitle;
        // Load session on clicking the text
        item.onclick = (e) => {
            if (!e.target.closest('.item-menu-dots-btn') && !e.target.closest('.item-dropdown')) {
                loadSession(session.id);
                renderSidebar();
            }
        };

        // 2. Input element (hidden by default) for renaming
        const renameInput = document.createElement('input');
        renameInput.type = 'text';
        renameInput.className = 'item-rename-input hidden';
        renameInput.value = session.title;
        
        // Handle input events (Save on Enter, Cancel on Escape, Save on Blur)
        renameInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                saveInlineRename(session.id, renameInput.value);
                updateTemp();
            }
            if (e.key === 'Escape') {
                renderSidebar(); // Cancels and resets
            }
        };
        renameInput.onblur = () => {
            saveInlineRename(session.id, renameInput.value);
        };
        renameInput.onclick = (e) => e.stopPropagation(); // Stop clicking input from loading session

        // 3. Three-dot options button
        const itemMenuBtn = document.createElement('button');
        itemMenuBtn.className = 'item-menu-dots-btn';
        itemMenuBtn.innerHTML = '•••';
        itemMenuBtn.onclick = (e) => {
            e.stopPropagation();
            toggleItemDropdown(e, session.id);
        };

        // 4. Custom Floating Dropdown Menu (Matching your reference image design)
        const itemDropdown = document.createElement('div');
        itemDropdown.className = 'item-dropdown hidden';
        itemDropdown.id = `item-dropdown-${session.id}`;

        // Rename Button with Pencil SVG
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
        //renaming with AI button
        const renameAI = document.createElement('button');
        renameAI.className = 'item-dropdown-btn';
        renameAI.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
            </svg>
            <span>Rename with AI</span>
        `;
        renameAI.onclick = (e) => {
            e.stopPropagation();
            closeAllItemDropdowns();
            startInAIRename(session.id,e.currentTarget);
        };
        
        renameOpt.onclick = (e) => {
            e.stopPropagation();
            startInlineRename(item, titleSpan, renameInput, itemMenuBtn);
        };

        // Delete Button with Trash Can SVG
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
        deleteOpt.onclick = (e) => {
            e.stopPropagation();
            const check = confirm("Are you sure you want to delete this chat?");
            if (check) {
                sessions = sessions.filter(s => s.id !== session.id);
                localStorage.setItem("chat_sessions", JSON.stringify(sessions));
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

        // Assemble row components
        item.appendChild(titleSpan);
        item.appendChild(renameInput);
        item.appendChild(itemMenuBtn);
        item.appendChild(itemDropdown);
        
        historyElement.appendChild(item);
    });
}
async function startInAIRename(sessionId,btn){
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    if (btn) btn.disabled=true;
    try {
        const response = await fetch('http://127.0.0.1:5000/api/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: session.messages })
        });

        const data = await response.json();
        if (data.title) {
            saveInlineRename(sessionId, data.title);
            updateTemp();
        }
    } catch (error) {
        console.error("Failed to rename with AI:", error);
    }finally{
    if(btn) btn.disabled=false;
    }
}
// Global functions for state handling
function startInlineRename(itemRow, titleSpan, input, menuBtn) {
    closeAllItemDropdowns();
    titleSpan.classList.add('hidden');
    menuBtn.classList.add('hidden');
    input.classList.remove('hidden');
    input.focus();
    input.select();
}

function saveInlineRename(sessionId, newTitle) {
    if (newTitle.trim() === '') {
        renderSidebar();
        return;
    }
    sessions = sessions.map(session => {
        if (session.id === sessionId) {
            session.title = newTitle;
        }
        return session;
    });
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    renderSidebar();
}

function toggleItemDropdown(event, sessionId) {
    event.stopPropagation();
    const settingsDropdown = document.getElementById("dropdown-menu");
    if (settingsDropdown) settingsDropdown.classList.remove("show");

    const currentItem = event.currentTarget.parentElement;
    const dropdown = currentItem.querySelector('.item-dropdown');
    if (!dropdown) return;

    // Remove the class first to reset position
    currentItem.classList.remove('position-up');

    // Logic: check if the dropdown would go off-screen
    const rect = currentItem.getBoundingClientRect();
    const containerHeight = document.querySelector('.history').clientHeight;
    
    // If the item is in the bottom 30% of the history container, force it up
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

// Global window click listener to close popups when clicking outside
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
    if (event) {
        event.preventDefault();
    }
    const userInput = document.querySelector('.search');
    storedValue = userInput.value;

    if (storedValue.trim() === "") return;
    if (title) title.innerText = "";
    if (!currentSessionId && !active) {
        currentSessionId = "session_" + Date.now();
        const newSession = {
            id: currentSessionId,
            title: storedValue.substring(0, 20),
            messages: []
        };
        sessions.push(newSession);
        const newUrl = `/session/${currentSessionId}`;
        window.history.pushState({ sessionId: currentSessionId }, "", newUrl);
        renderSidebar();
    }
    const currentSession = active ? null : sessions.find(s => s.id === currentSessionId); 
    const newMessage = document.createElement('div');
    newMessage.innerText = storedValue;
    newMessage.classList.add('message', 'user-message');
    chatHistory.appendChild(newMessage);

    updateTemp();

    if (currentSession) {
        currentSession.messages.push({
            sender: 'user-message',
            role: 'user',
            text: storedValue
        });
        localStorage.setItem("chat_sessions", JSON.stringify(sessions));
        if (currentSession.messages.length === 1) {
        startInAIRename(currentSession.id, { disabled: false });
    }
    }

    userInput.value = "";
    userInput.style.height = "auto";
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const aiMessage = document.createElement('div');
    aiMessage.classList.add('message', 'ai-message');
    aiMessage.innerText = "Thinking...";
    chatHistory.appendChild(aiMessage);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        const response = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: storedValue,
                history: currentSession ? currentSession.messages : []
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        aiMessage.innerText = data.reply;

        if (currentSession) {
            currentSession.messages.push({
                sender: 'ai-message',
                role: 'model',
                text: data.reply
            });
            localStorage.setItem("chat_sessions", JSON.stringify(sessions));
        }
    } catch (error) {
        console.error('Error:', error);
        aiMessage.innerText = "Error: Could not reach the server.";
    }

    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function loadSession(id) {
    const session = sessions.find(s => s.id === id);
    const titleSpan = document.createElement('span');
    titleSpan.className = 'item-title-span';
    const shortTitle = session.title.split(' ').slice(0, 4).join(' ');
    const hasMoreWords = session.title.split(' ').length > 4;
    titleSpan.textContent = hasMoreWords ? `${shortTitle}...` : shortTitle;
    currentSessionId = id;
    active = false; 

    const newUrl = `/session/${id}`;
    window.history.pushState({ sessionId: id }, "", newUrl);
    if (title) {
        title.innerText = titleSpan.textContent;
        title.style.display = "block"; 
    }

    chatHistory.innerHTML = '';

    if (session) {
        session.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('message', msg.sender);
            msgDiv.innerText = msg.text;
            chatHistory.appendChild(msgDiv);
        });
    }
    
    updateTemp();
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function createNewChat() {
    tempChat.style.display = "block";
    title.style.display = "block";
    title.innerText = "What’s on your mind today?";
    document.title = "AI-AGENT";

   const cleanUrl = "/";
    window.history.pushState({}, "", cleanUrl);

    currentSessionId = null;
    active = false; 
    
    const historyContainer = document.getElementById("chat-history");
    if (historyContainer) {
        historyContainer.innerHTML = '';
    }
    const inputField = document.querySelector(".search");
    if (inputField) {
        inputField.value = "";
    }  
    updateTemp();
    renderSidebar();
}
function togglePanel() {
    const container = document.querySelector('.container');
    container.classList.toggle('panel-closed');
}
renderSidebar();
function toggleDropdown(event) {
    event.stopPropagation();
    closeAllItemDropdowns();
    const dropdown = document.getElementById("dropdown-menu");
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
}
window.addEventListener('click', function(event) {
    if (!event.target.matches('.menu-dots-btn')) {
        const dropdown = document.getElementById("dropdown-menu");
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
});
function handleDelete() {
    if (chatHistory.children.length <= 0) return;
    const check = confirm("Are you sure you want to delete this chat?");
    if(!check){return;}
    if (!currentSessionId) {
        if (chatHistory) chatHistory.innerHTML = '';
        updateTemp();
        return;
    }
    sessions = sessions.filter(session => session.id !== currentSessionId);
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    renderSidebar();
    createNewChat();
}
const searchBox = document.querySelector(".search");
function handleAutoGrow() {
    searchBox.style.height = "auto";
    searchBox.style.height = searchBox.scrollHeight + "px";
}
searchBox.addEventListener("input", handleAutoGrow);
function InitializeChat() {
    const path = window.location.pathname;
    const pathSegments = path.split("/").filter(Boolean); // e.g., ["session", "session_123"]
    
    // Check if the current URL matches /session/<id>
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
window.addEventListener('DOMContentLoaded', ()=>{
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeUI(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateThemeUI(false);
    }
    InitializeChat();
});
window.addEventListener('popstate',InitializeChat );
window.addEventListener('keydown',(event)=>{
    if (event.ctrlKey && event.altKey && event.key=='n'){
        event.preventDefault();
        createNewChat();
    }
});