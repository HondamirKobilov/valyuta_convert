let isMicPressed = false;
let hasStartedRecording = false;
let startTime, timerInterval;
let mediaRecorder;
let recordedChunks = [];
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendOrMicBtn");
const micIcon = document.getElementById("micIcon");
const chatFooter = document.getElementById("chat-footer");
const voiceUI = document.getElementById("voice-record-ui");
const timeSpan = document.getElementById("recordingTime");
const sendVoiceBtn = document.getElementById("sendVoiceBtn");
const chatMessages = document.getElementById("chat-messages");

window.addEventListener("message", function (event) {
  if (event.origin !== "https://oauth.telegram.org") return;
  const data = event.data;
  if (data.id) {
    window.chat_id = data.id;
    console.log("Telegram chat_id olindi:", window.chat_id);
  }
}, false);

sendVoiceBtn.addEventListener("click", () => {
  if (hasStartedRecording && mediaRecorder && mediaRecorder.state === "recording") {
    clearInterval(timerInterval);
    voiceUI.classList.add("d-none");
    chatFooter.classList.remove("d-none");
    micIcon.src = "/static/img/microphone.svg";
    micIcon.alt = "Mic";
    sendVoiceBtn.classList.remove("pulse-button");
    hasStartedRecording = false;
    isCanceled = false;
    mediaRecorder.stop();
    if (mediaRecorder?.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
});

input.addEventListener("input", () => {
  const hasText = input.value.trim().length > 0;
  micIcon.src = hasText ? "/static/img/send.svg" : "/static/img/microphone.svg";
  micIcon.alt = hasText ? "Send" : "Mic";
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = input.value.trim();
    if (text.length > 0) {
      appendMessage(text, "user");
      if (isValidURL(text)) fetchAndRespondMedia(text);
      input.value = "";
      input.style.height = "auto";
      micIcon.src = "/static/img/microphone.svg";
    }
  }
});

sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (text.length > 0) {
    appendMessage(text, "user");
    if (isValidURL(text)) fetchAndRespondMedia(text);
    input.value = "";
    input.style.height = "auto";
    micIcon.src = "/static/img/microphone.svg";
  } else if (!hasStartedRecording) {
    startRecording();
  }
});

function isValidURL(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

async function fetchAndRespondMedia(link) {
  const apiUrl = `/shazam/api/fetch_instagram_media/?url=${encodeURIComponent(link)}`;
  try {
    appendMessage("⏳ Yuklanmoqda...", "bot");

    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.error || !data.medias || data.medias.length === 0) {
      appendMessage("❌ Media topilmadi yoki yuklab bo‘lmadi.", "bot");
      return;
    }

    for (const media of data.medias) {
      if (media.type === "video") {
        appendBotVideo(media.download_url);
      } else if (media.type === "image") {
        appendBotImage(media.download_url);
      }
    }

  } catch (err) {
    console.error("API xatoligi:", err);
    appendMessage("❌ Xatolik yuz berdi. Qayta urinib ko‘ring.", "bot");
  }
}


function appendMessage(text, sender = "user") {
  const div = document.createElement("div");
  div.className = `chat-bubble ${sender}`;
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const meta = `<div class="message-meta">${time} <span class="message-status">✓✓</span></div>`;
  div.innerHTML = `<div>${text}</div>${meta}`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendBotVideo(url) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble bot";
  const video = document.createElement("video");
  video.src = url;
  video.controls = true;
  video.style.width = "100%";
  video.style.borderRadius = "8px";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <span style="margin-left:4px;">✓✓</span>`;
  wrapper.appendChild(video);
  wrapper.appendChild(meta);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendBotImage(url) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble bot";
  const img = document.createElement("img");
  img.src = url;
  img.style.width = "100%";
  img.style.borderRadius = "8px";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <span style="margin-left:4px;">✓✓</span>`;
  wrapper.appendChild(img);
  wrapper.appendChild(meta);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
