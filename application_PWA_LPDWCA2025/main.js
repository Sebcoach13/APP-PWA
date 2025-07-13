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

// =====================
// RiveScript Bot setup
// =====================
const bot = new RiveScript();
let botReady = false;

bot.loadFile('brain.rive').then(() => {
    bot.sortReplies();
    botReady = true;
    console.log('🤖 RiveScript chargé !');
}).catch(err => console.error('Erreur RiveScript :', err));

// =====================
// Affichage des messages
// =====================
function getSenderInitial(sender) {
    return sender.charAt(0).toUpperCase();
}

function displayMessage(text, sender, timestamp) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex', 'items-start', 'w-full', 'mb-2');

    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble', 'p-3', 'shadow-sm');

    const initial = document.createElement('div');
    initial.classList.add('sender-initial-bubble', 'text-lg');

    const isMine = sender === pseudoInput.value.trim();
    wrapper.classList.add(isMine ? 'justify-end' : 'justify-start');
    bubble.classList.add(isMine ? 'message-mine' : 'message-other');
    initial.classList.add(isMine ? 'sender-initial-mine' : 'sender-initial-other');

    initial.textContent = getSenderInitial(sender);
    bubble.innerHTML = `
        <span class="text-xs font-semibold ${isMine ? 'text-gray-500' : 'text-gray-700'} mb-1">
            ${sender}
        </span>
        <p class="text-sm font-normal">${text}</p>
        <span class="message-timestamp">${timestamp}</span>
    `;

    if (isMine) {
        wrapper.append(bubble, initial);
    } else {
        wrapper.append(initial, bubble);
    }

    messagesContainer.appendChild(wrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// =====================
// Stockage local
// =====================
function saveMessage(msg) {
    const arr = JSON.parse(localStorage.getItem('messages')) || [];
    arr.push(msg);
    localStorage.setItem('messages', JSON.stringify(arr));
}

function loadMessages() {
    const arr = JSON.parse(localStorage.getItem('messages')) || [];
    messagesContainer.innerHTML = '';
    if (arr.length === 0) {
        messagesContainer.innerHTML = `
            <div class="text-center text-gray-500 p-4 mt-auto">
                <p>Commencez à discuter !</p>
            </div>`;
    } else {
        arr.forEach(m => displayMessage(m.text, m.sender, m.timestamp));
    }
}

// =====================
// Synchro Claudia
// =====================
function syncMessagesWithServer() {
    if (!navigator.onLine) return;
    const all = JSON.parse(localStorage.getItem('messages')) || [];
    const unsent = all.filter(m => m.sent === false);
    if (!unsent.length) return;

    // Simulation backend
    Promise.resolve().then(() => {
        const updated = all.map(m => ({ ...m, sent: true }));
        localStorage.setItem('messages', JSON.stringify(updated));
        console.log('🔄 Synchronisation terminée');
    });
}

// Déclencheurs
window.addEventListener('online', syncMessagesWithServer);
setInterval(syncMessagesWithServer, 5000);

// =====================
// Envoi de messages
// =====================
function sendMessage() {
    const pseudo = pseudoInput.value.trim();
    const text   = messageInput.value.trim();
    if (!pseudo) {
        console.warn('Entrez votre prénom.');
        return;
    }
    if (!text) return;

    const now       = new Date();
    const timestamp = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const message   = { text, sender: pseudo, timestamp, sent: false };

    displayMessage(text, pseudo, timestamp);
    saveMessage(message);
    messageInput.value = '';

    syncMessagesWithServer();

    if (!botReady) {
        console.warn('🤖 Bot pas prêt.');
        return;
    }
    bot.reply('local-user', text).then(reply => {
        const resp = {
            text: reply,
            sender: 'Alice',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            sent: true
        };
        displayMessage(resp.text, resp.sender, resp.timestamp);
        saveMessage(resp);

        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Nouveau message !', {
                    body: `${resp.sender}: ${resp.text}`,
                    icon: 'icons/icon-192.png'
                });
            });
        }
    });
}

// =====================
// Event listeners
// =====================
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', e => { if (e.key==='Enter') sendMessage(); });
resetButton?.addEventListener('click', () => {
    localStorage.removeItem('messages');
    messagesContainer.innerHTML = `
        <div class="text-center text-gray-500 p-4 mt-auto">
            <p>Conversation réinitialisée.</p>
        </div>`;
    loadMessages();
});

// =====================
// PWA & Notifications
// =====================
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e; installButton.style.display = 'block';
});
installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    installButton.style.display = 'none';
    await deferredPrompt.prompt();
    deferredPrompt = null;
});

// Fonction pour mettre à jour l'état du bouton de notification
function updateNotificationButtonState() {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            notificationPermissionButton.textContent = 'Notifications Activées';
            notificationPermissionButton.disabled = true;
        } else if (Notification.permission === 'denied') {
            notificationPermissionButton.textContent = 'Notifications Bloquées';
            notificationPermissionButton.disabled = true;
        } else { // 'default'
            notificationPermissionButton.textContent = 'Activer Notifications';
            notificationPermissionButton.disabled = false;
        }
    } else {
        notificationPermissionButton.textContent = 'Notifications non supportées';
        notificationPermissionButton.disabled = true;
    }
}

notificationPermissionButton.addEventListener('click', () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            console.log('Permission de notification:', permission);
            updateNotificationButtonState();
        });
    }
});

// =====================
// Statut connexion & Init
// =====================
function updateOnlineStatus() {
    if (navigator.onLine) {
        statusIndicator.classList.replace('bg-red-500','bg-green-500');
        statusIndicator.title = 'En ligne';
    } else {
        statusIndicator.classList.replace('bg-green-500','bg-red-500');
        statusIndicator.title = 'Hors ligne';
    }
}
window.addEventListener('online',   updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker enregistré avec succès:', registration);
                updateOnlineStatus();
                syncMessagesWithServer();
            })
            .catch(error => {
                console.error('Échec de l\'enregistrement du Service Worker:', error);
            });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    updateOnlineStatus();
    updateNotificationButtonState();
});
