const API = "https://chatirul-backend.onrender.com"; // backend URL kamu

let currentConversationId = null;
const conversationList = document.getElementById("conversationList");
const messageList = document.getElementById("messageList");
const inputBox = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newConvBtn = document.getElementById("newConvBtn");
const resetSessionBtn = document.getElementById("resetSessionBtn");

// Buat sesi otomatis kalau belum ada
async function ensureSession() {
  if (!currentConversationId) {
    await createNewConversation();
  }
}

// Buat percakapan baru
async function createNewConversation() {
  try {
    const res = await fetch(`${API}/conversations`, { method: "POST" });
    if (!res.ok) throw new Error("Gagal membuat conversation");
    const data = await res.json();
    currentConversationId = data.id;
    addConversationToList(data.id);
    clearMessages();
    console.log("Conversation baru:", currentConversationId);
  } catch (err) {
    alert("Gagal buat conversation baru: " + err.message);
  }
}

// Tambahkan conversation ke daftar
function addConversationToList(id) {
  const li = document.createElement("li");
  li.textContent = "Chat " + id.substring(0, 6);
  li.onclick = () => {
    currentConversationId = id;
    clearMessages();
    console.log("Berpindah ke:", id);
  };
  conversationList.appendChild(li);
}

// Kirim pesan ke backend
async function sendMessage() {
  await ensureSession();

  const text = inputBox.value.trim();
  if (!text) return;

  appendMessage("user", text);
  inputBox.value = "";

  try {
    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: currentConversationId,
        text: text,
      }),
    });

    const data = await res.json();
    appendMessage("bot", data.response);
  } catch (err) {
    appendMessage("bot", "[Gagal terhubung ke backend]");
  }
}

// Tambahkan pesan ke UI
function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender;
  div.textContent = (sender === "user" ? "🧍: " : "🤖: ") + text;
  messageList.appendChild(div);
  messageList.scrollTop = messageList.scrollHeight;
}

// Bersihkan pesan
function clearMessages() {
  messageList.innerHTML = "";
}

// Reset session
function resetSession() {
  currentConversationId = null;
  clearMessages();
  conversationList.innerHTML = "";
  console.log("Session direset.");
}

// Event listener
sendBtn.onclick = sendMessage;
newConvBtn.onclick = createNewConversation;
resetSessionBtn.onclick = resetSession;

// Jalankan saat halaman dibuka
window.onload = async () => {
  await ensureSession();
  console.log("Session awal dibuat otomatis:", currentConversationId);
};
