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
function updateTemp() {
    if (tempChat) {
        if ((chatHistory && chatHistory.children.length > 0) || currentSessionId) {
            tempChat.style.display = "none";
        } else {
            tempChat.style.display = "block";
        }
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
        const themeText = dropdownDarkModeBtn.querySelector('.theme-text');
        if (counter % 2 != 0) {
            document.body.style.backgroundColor = "rgb(0, 0, 0)";
            document.querySelector('.title').style.color = "#3A3A3C";
            
            document.querySelector('.input-container').style.backgroundColor = "#3A3A3C";
            document.querySelector('.input-container').style.borderColor = "#4A4A4C";

            document.querySelector('.search').style.backgroundColor = "transparent";
            document.querySelector('.search').style.color = "#ffffff";
            
            document.querySelector('.sender').style.backgroundColor = "rgba(255, 255, 255, 0.15)";
            document.querySelector('.sender svg').style.color = "#ffffff";
            document.querySelector('.newchat').style.color = "#E3E6EB";
            document.querySelector('.toggle-btn').style.backgroundColor = "#3A3A3C";
            document.querySelector('.leftpanel').style.backgroundColor = "#1E1F22";
            document.querySelector('.leftpanel').style.color = "#E3E6EB";
            themeText.textContent = "Toggle Light Mode";
            counter++;
        } else {
            document.body.style.backgroundColor = "rgb(255, 255, 255)";
            document.querySelector('.title').style.color = "rgb(0, 0, 0)";
            
            document.querySelector('.input-container').style.backgroundColor = "#f4f4f4";
            document.querySelector('.input-container').style.borderColor = "#e3e3e3";

            document.querySelector('.search').style.backgroundColor = "transparent";
            document.querySelector('.search').style.color = "rgb(0, 0, 0)";
            
            document.querySelector('.sender').style.backgroundColor = "#ffffff";
            document.querySelector('.sender svg').style.color = "#000000";

            document.querySelector('.toggle-btn').style.backgroundColor = "transparent";
            document.querySelector('.leftpanel').style.backgroundColor = "#F9F9FB";
            document.querySelector('.leftpanel').style.color = "#4A4A4A";
            document.querySelector('.newchat').style.color = "#000000";
            themeText.textContent = "Toggle Dark Mode";
            counter++;
        }
        document.getElementById("dropdown-menu").classList.remove("show");
    });
}

function renderSidebar() {
    if (!historyElement) return;
    historyElement.innerHTML = '';
    sessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'chat-log-item';
        const shortTitle = session.title.split(' ').slice(0, 4).join(' ');
        const hasMoreWords = session.title.split(' ').length > 4;
        item.textContent = hasMoreWords ? `${shortTitle}...` : shortTitle;
        item.style.cursor = 'pointer';
        item.onclick = () => loadSession(session.id);
        historyElement.append(item);
    });
}

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
    currentSessionId = id;
    active = false; 
    if (title) {
        title.innerText = "";
        title.style.display = "block"; 
    }
    const session = sessions.find(s => s.id === id);

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
        title.style.display = "block";
        title.innerText = "What’s on your mind today?";

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
}
function togglePanel() {
    const container = document.querySelector('.container');
    container.classList.toggle('panel-closed');
}
renderSidebar();
function toggleDropdown(event) {
    event.stopPropagation();
    document.getElementById("dropdown-menu").classList.toggle("show");
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