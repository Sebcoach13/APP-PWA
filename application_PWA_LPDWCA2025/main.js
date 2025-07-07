// =====================
// Initialisation du DOM
// =====================
const pseudoInput = document.getElementById('pseudo-input');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages-container');
const installButton = document.getElementById('install-button');
const notificationPermissionButton = document.getElementById('notification-permission-button');
const statusIndicator = document.getElementById('status-indicator');
const resetButton = document.getElementById('reset-button');
let deferredPrompt;

// ==========================
// Désactivation localStorage
// ==========================
try {
  localStorage.clear();
  localStorage.setItem = () => {};
  localStorage.getItem = () => null;
  localStorage.removeItem = () => {};
} catch (e) {
  console.warn("localStorage désactivé.");
}

// =====================
// RiveScript Bot setup
// =====================
const bot = new RiveScript();
let botReady = false;

bot.loadFile("brain.rive").then(() => {
  bot.sortReplies();
  botReady = true;
  console.log("🤖 RiveScript chargé et trié !");
}).catch(err => {
  console.error("Erreur chargement RiveScript :", err);
});

// =====================
// Affichage des messages
// =====================
function getSenderInitial(sender) {
  return sender.charAt(0).toUpperCase();
}

function displayMessage(text, sender, timestamp) {
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('flex', 'items-start', 'w-full', 'mb-2');

  const senderInitial = getSenderInitial(sender);
  const initialBubble = document.createElement('div');
  initialBubble.classList.add('sender-initial-bubble', 'text-lg');
  initialBubble.textContent = senderInitial;

  const messageElement = document.createElement('div');
  messageElement.classList.add('message-bubble', 'p-3', 'shadow-sm');

  const senderColorClass = (sender === pseudoInput.value.trim()) ? 'text-gray-500' : 'text-gray-700';
  const senderHtml = `<span class="text-xs font-semibold ${senderColorClass} mb-1">${sender}</span>`;

  if (sender === pseudoInput.value.trim()) {
    messageWrapper.classList.add('justify-end');
    initialBubble.classList.add('sender-initial-mine', 'order-2');
    messageElement.classList.add('message-mine');
  } else {
    messageWrapper.classList.add('justify-start');
    initialBubble.classList.add('sender-initial-other', 'order-1');
    messageElement.classList.add('message-other');
  }

  messageElement.innerHTML = `
    ${senderHtml}
    <p class="text-sm font-normal">${text}</p>
    <span class="message-timestamp">${timestamp}</span>
  `;

  if (sender === pseudoInput.value.trim()) {
    messageWrapper.appendChild(messageElement);
    messageWrapper.appendChild(initialBubble);
  } else {
    messageWrapper.appendChild(initialBubble);
    messageWrapper.appendChild(messageElement);
  }

  messagesContainer.appendChild(messageWrapper);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// =====================
// Stockage temporaire
// =====================
function saveMessage(message) {
  const messages = JSON.parse(sessionStorage.getItem('messages')) || [];
  messages.push(message);
  sessionStorage.setItem('messages', JSON.stringify(messages));
}

function loadMessages() {
  const messages = JSON.parse(sessionStorage.getItem('messages')) || [];
  messagesContainer.innerHTML = '';
  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="text-center text-gray-500 p-4 mt-auto"><p>Commencez à échanger !</p></div>';
  } else {
    messages.forEach(msg => displayMessage(msg.text, msg.sender, msg.timestamp));
  }
}

// =====================
// Envoi de messages
// =====================
function sendMessage() {
  const pseudo = pseudoInput.value.trim();
  const text = messageInput.value.trim();

  if (!pseudo) {
    alert('Veuillez entrer votre prénom.');
    return;
  }

  if (text) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const message = { text, sender: pseudo, timestamp };

    displayMessage(text, pseudo, timestamp);
    saveMessage(message);
    messageInput.value = '';

    if (!botReady) {
      console.warn("🤖 Le bot n’est pas prêt.");
      return;
    }

    bot.reply("local-user", text).then(responseText => {
      const response = {
        text: responseText,
        sender: 'Alice',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      displayMessage(response.text, response.sender, response.timestamp);
      saveMessage(response);

      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('Nouveau message !', {
            body: `${response.sender}: ${response.text}`,
            icon: 'https://placehold.co/192x192/25D366/ffffff?text=WA',
            tag: 'new-message'
          });
        });
      }
    });
  }
}

// =====================
// Réinitialisation
// =====================
resetButton?.addEventListener('click', () => {
  sessionStorage.clear();
  messagesContainer.innerHTML = '<div class="text-center text-gray-500 p-4 mt-auto"><p>Conversation réinitialisée.</p></div>';
});

// =====================
// Installation PWA
// =====================
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installButton.style.display = 'block';
});

installButton.addEventListener('click', async () => {
  if (deferredPrompt) {
    installButton.style.display = 'none';
    await deferredPrompt.prompt();
    deferredPrompt = null;
  }
});

// =====================
// Notifications
// =====================
notificationPermissionButton.addEventListener('click', () => {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        notificationPermissionButton.textContent = 'Notifications Activées';
        notificationPermissionButton.disabled = true;
      }
    });
  }
});

// =====================
// Service Worker
// =====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => updateOnlineStatus())
      .catch(err => console.error('Erreur SW:', err));
  });
}

// =====================
// Statut de connexion
// =====================
function updateOnlineStatus() {
  if (navigator.onLine) {
    statusIndicator.classList.replace('bg-red-500', 'bg-green-500');
    statusIndicator.title = 'En ligne';
  } else {
    statusIndicator.classList.replace('bg-green-500', 'bg-red-500');
    statusIndicator.title = 'Hors ligne';
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// =====================
// Initialisation
// =====================
window.addEventListener('DOMContentLoaded', () => {
  loadMessages();
  updateOnlineStatus();
});

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
