// app.js (frontend ready-to-use, set API url di baris bawah)
const convsDiv = document.getElementById('convs');
const chatDiv = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const newConvBtn = document.getElementById('newConv');
const resetSessionBtn = document.getElementById('resetSession');
const titleEl = document.getElementById('title');

// SET URL BACKEND RENDER DI SINI:
const API = "https://chatirul-backend.onrender.com";

let session_id = localStorage.getItem('session_id');
let current_conv = parseInt(localStorage.getItem('conversation_id') || "0", 10);

async function createNewConversation() {
  try {
    const res = await fetch(`${API}/conversations`, { method: "POST" });
    if (!res.ok) throw new Error(`Gagal membuat conversation: ${res.status}`);
    const data = await res.json();
    currentConversationId = data.id;
    addConversationToList(data.id);
    console.log("Conversation baru:", currentConversationId);
  } catch (err) {
    console.error(err);
    alert("Gagal membuat conversation baru. Cek koneksi backend di Render!");
  }
}

async function loadConversations(){
  await ensureSession();
  const res = await fetch(API + `/api/conversations/${session_id}`);
  const j = await res.json();
  convsDiv.innerHTML = "";
  j.conversations.forEach(c => {
    const d = document.createElement('div');
    d.className = 'conv';
    d.textContent = c.title + " (" + c.id + ")";
    d.onclick = () => {
      current_conv = c.id;
      localStorage.setItem('conversation_id', current_conv);
      loadMessages(current_conv);
    };
    convsDiv.appendChild(d);
  });
}

async function loadMessages(convId){
  const res = await fetch(API + `/api/messages/${convId}`);
  const j = await res.json();
  chatDiv.innerHTML = "";
  j.messages.forEach(m => {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.role === 'assistant' ? 'assistant' : 'user');
    d.innerHTML = `<strong>${m.role}:</strong> ${m.content}`;
    chatDiv.appendChild(d);
  });
  titleEl.textContent = "Conversation #" + convId;
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;
  if (!current_conv) {
    alert("Pilih atau buat conversation dulu");
    return;
  }
  appendMessage('user', text);
  input.value = '';
  appendMessage('assistant', '...thinking');
  try {
    const res = await fetch(API + '/api/send', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({session_id, conversation_id: current_conv, message: text})
    });
    const j = await res.json();
    replaceLastAssistant(j.text);
  } catch (e) {
    replaceLastAssistant('Error: ' + e.message);
  }
};

function appendMessage(role, text) {
  const d = document.createElement('div');
  d.className = 'msg ' + (role === 'assistant' ? 'assistant' : 'user');
  d.innerHTML = `<strong>${role}:</strong> ${text}`;
  chatDiv.appendChild(d);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

function replaceLastAssistant(text) {
  const nodes = chatDiv.querySelectorAll('.assistant');
  if (nodes.length === 0) {
    appendMessage('assistant', text);
    return;
  }
  const last = nodes[nodes.length - 1];
  last.innerHTML = `<strong>assistant:</strong> ${text}`;
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

newConvBtn.onclick = async () => {
  await ensureSession();
  const res = await fetch(API + '/api/new-conversation', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({session_id})
  });
  const j = await res.json();
  current_conv = j.conversation_id;
  localStorage.setItem('conversation_id', current_conv);
  await loadConversations();
  await loadMessages(current_conv);
};

resetSessionBtn.onclick = async () => {
  localStorage.removeItem('session_id');
  localStorage.removeItem('conversation_id');
  session_id = null;
  current_conv = 0;
  await ensureSession();
  await loadConversations();
  await loadMessages(current_conv);
};

(async () => {
  await ensureSession();
  await loadConversations();
  if (current_conv) await loadMessages(current_conv);
})();
