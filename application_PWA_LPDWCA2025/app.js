const form = document.getElementById('chat-form');
const pseudoInput = document.getElementById('pseudo');
const messageInput = document.getElementById('message');
const chatBox = document.createElement('div');
chatBox.className = 'flex flex-col gap-2 mb-4';
document.querySelector('main').prepend(chatBox);

// Charger les messages depuis le localStorage
const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
messages.forEach(addMessageToDOM);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const pseudo = pseudoInput.value.trim();
  const message = messageInput.value.trim();
  if (pseudo && message) {
    const msgObj = { pseudo, message };
    addMessageToDOM(msgObj);
    messages.push(msgObj);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    messageInput.value = '';
  }
});

function addMessageToDOM({ pseudo, message }) {
  const isMe = pseudoInput.value.trim() === pseudo;
  const msgDiv = document.createElement('div');
  msgDiv.className = `max-w-xs p-2 rounded-lg ${
    isMe ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 self-start'
  }`;
  msgDiv.innerHTML = `<strong>${pseudo} :</strong> ${message}`;
  chatBox.appendChild(msgDiv);
}
