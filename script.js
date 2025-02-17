// login elements
const login = document.querySelector(".login");
const loginForm = login.querySelector(".login__form");
const loginInput = login.querySelector(".login__input");

// chat elements
const chat = document.querySelector(".chat");
const chatForm = chat.querySelector(".chat__form");
const chatInput = chat.querySelector(".chat__input");
const chatMessages = chat.querySelector(".chat__messages");

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
];

const user = { id: "", name: "", color: "" };

let websocket;

// Create message elements
const createMessageSelfElement = (content) => {
    const div = document.createElement("div");
    div.classList.add("message--self");
    div.innerHTML = content;
    return div;
};

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div");
    const span = document.createElement("span");

    div.classList.add("message--other");
    span.classList.add("message--sender");
    span.style.color = senderColor;

    div.appendChild(span);
    span.innerHTML = sender;
    div.innerHTML += content;

    return div;
};

// Get a random color for the user
const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
};

// Scroll to the bottom of the chat
const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
};

// Process incoming messages
const processMessage = ({ data }) => {
    const { userId, userName, userColor, content } = JSON.parse(data);

    const message =
        userId == user.id
            ? createMessageSelfElement(content)
            : createMessageOtherElement(content, userName, userColor);

    chatMessages.appendChild(message);
    scrollScreen();
};

// Handle login form submission
const handleLogin = (event) => {
    event.preventDefault();

    user.id = generateUUID(); // Use the fallback UUID function
    user.name = loginInput.value;
    user.color = getRandomColor();

    login.style.display = "none";
    chat.style.display = "flex";

    // Try to create a WebSocket connection
    websocket = new WebSocket(`ws://${window.location.hostname}:8080`);

    websocket.onopen = () => {
        console.log('Conexão WebSocket estabelecida!');
    };

    websocket.onmessage = processMessage;
    websocket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        alert('Erro ao conectar ao servidor WebSocket.');
    };

    websocket.onclose = () => {
        console.log('Conexão WebSocket fechada.');
    };
};

// Send message to the server
const sendMessage = (event) => {
    event.preventDefault();

    if (websocket.readyState === WebSocket.OPEN) {
        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: chatInput.value
        };

        websocket.send(JSON.stringify(message));
        chatInput.value = "";
    } else {
        console.error('WebSocket não está conectado!');
        alert('WebSocket não está conectado!');
    }
};

// Generate a fallback UUID if crypto.randomUUID is not available
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Event listeners for form submissions
loginForm.addEventListener("submit", handleLogin);
chatForm.addEventListener("submit", sendMessage);
