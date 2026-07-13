let sessions = JSON.parse(localStorage.getItem("chat_sessions")) || [];
let currentSessionId = null;
let active = false; 
let storedValue = "";
const image = document.getElementById('click-image');
const tempChat = document.getElementById('temp-image');
const historyElement = document.querySelector('.history');
const temptext = document.getElementById('temp-text') 
const title = document.querySelector('.title');
const tglBtn=document.querySelector('.toggle-btn');
function updateTemp() {
    if (tempChat) {
        const chatHistory = document.getElementById('chat-history');
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
            if (temptext) temptext.style.display = "block";
            active = true;
        } else {
            if (title) title.innerText = "AI Agent";
            if (temptext) temptext.style.display = "none";
            active = false;
        }
        updateTemp(); 
    });
}

if (image) {
    image.addEventListener('click', function () {
        if (document.body.style.backgroundColor === "rgb(255, 255, 255)") {
            document.body.style.backgroundColor = "rgb(0, 0, 0)";
            document.querySelector('.title').style.color = "rgb(18, 35, 72)";
            document.querySelector('.search').style.backgroundColor = "rgb(0, 0, 0)";
            document.querySelector('.search').style.color = "#ffffff";
            document.querySelector('.sender').style.backgroundColor = "#3A3A3C";
            document.querySelector('.toggle-btn').style.backgroundColor = "#3A3A3C";
            document.querySelector('.newchat').style.backgroundColor = "#3A3A3C";
            document.querySelector('.leftpanel').style.backgroundColor = "#1E1F22";
            document.querySelector('.leftpanel').style.color = "#E3E6EB";
        } else {
            document.body.style.backgroundColor = "rgb(255, 255, 255)";
            document.querySelector('.title').style.color = "rgb(0, 0, 0)";
            document.querySelector('.search').style.backgroundColor = "rgb(255, 255, 255)";
            document.querySelector('.search').style.color = "rgb(0, 0, 0)";
            document.querySelector('.sender').style.backgroundColor = "rgb(255, 255, 255)";
            document.querySelector('.toggle-btn').style.backgroundColor = "rgb(255, 255, 255)";
            document.querySelector('.leftpanel').style.backgroundColor = "#F9F9FB";
            document.querySelector('.leftpanel').style.color = "#4A4A4A";
            document.querySelector('.newchat').style.backgroundColor = "rgb(255, 255, 255)";
        }
    });
}

function renderSidebar() {
    if (!historyElement) return;
    historyElement.innerHTML = '';
    sessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'chat-log-item';
        const shortTitle = session.title.split(' ').slice(0, 3).join(' ');
        const hasMoreWords = session.title.split(' ').length > 3;
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
    const chatHistory = document.getElementById('chat-history');
    storedValue = userInput.value;

    if (storedValue.trim() === "") return;

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
    if (temptext) temptext.style.display = "none";
    if (title) title.innerText = "AI Agent";
    const session = sessions.find(s => s.id === id);
    const chatHistory = document.getElementById('chat-history');

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
    currentSessionId = null;
    active = false; 
    if (title) title.innerText = "AI Agent";
    if (temptext) temptext.style.display = "none";
    
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