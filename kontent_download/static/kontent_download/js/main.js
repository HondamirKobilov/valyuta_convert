let isMicPressed = false;
let hasStartedRecording = false;
let startY = 0;
const recordThreshold = 40;
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

window.addEventListener("message", function(event) {
  if (event.origin !== "https://oauth.telegram.org") {
    return;
  }
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
    input.value = "";
    input.style.height = "auto";
    micIcon.src = "/static/img/microphone.svg";
  } else {
    if (!hasStartedRecording) {
      startRecording();
    }
  }
});


sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (text.length > 0) {
    appendMessage(text, "user");
    input.value = "";
    input.style.height = "auto";
    micIcon.src = "/static/img/microphone.svg";
  } else {
    if (!hasStartedRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }
});


async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      if (!isCanceled && recordedChunks.length > 0) {
        sendVoice();
      } else {
        console.log("🚫 Yozish cancel qilindi, chatga yuborilmadi.");
      }
      isCanceled = false;
    };

    mediaRecorder.start();
    hasStartedRecording = true;
    chatFooter.classList.add("d-none");
    voiceUI.classList.remove("d-none");
    sendVoiceBtn.classList.add("pulse-button");

    startTime = performance.now();
    timerInterval = setInterval(() => {
      const t = performance.now() - startTime;
      const sec = Math.floor(t / 1000);
      const d = Math.floor((t % 1000) / 100);
      timeSpan.textContent = `00:${sec < 10 ? "0" + sec : sec}.${d}`;
    }, 100);
  } catch (err) {
    alert("🎙 Mikrofonga ruxsat berilmadi.");
    cancelRecording();
  }
}

function stopRecording() {
  clearInterval(timerInterval);
  voiceUI.classList.add("d-none");
  chatFooter.classList.remove("d-none");
  sendVoiceBtn.classList.remove("pulse-button");
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  hasStartedRecording = false;
}

function cancelRecording() {
  clearInterval(timerInterval);
  console.log("cancel click bo'ldi");
  voiceUI.classList.add("d-none");
  chatFooter.classList.remove("d-none");
  sendVoiceBtn.classList.remove("pulse-button");
  isMicPressed = false;
  hasStartedRecording = false;
  recordedChunks = [];
  isCanceled = true;
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  if (mediaRecorder?.stream) {
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}


function appendMessage(text, sender = "user") {
  const div = document.createElement("div");
  div.className = `chat-bubble ${sender}`;

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const time = `${hour % 12 || 12}:${minute < 10 ? "0" + minute : minute} ${hour >= 12 ? "PM" : "AM"}`;

  const meta = `<div class="message-meta">${time} <span class="message-status">✓✓</span></div>`;
  div.innerHTML = `<div>${text}</div>${meta}`;

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}



function sendVoice() {
  if (recordedChunks.length === 0) return;
  const blob = new Blob(recordedChunks, { type: "audio/webm;codecs=opus" });
  const url = URL.createObjectURL(blob);

  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble user";

  const player = document.createElement("div");
  player.className = "voice-player";

  const playBtn = document.createElement("button");
  playBtn.className = "play-button";

  const waveformContainer = document.createElement("div");
  waveformContainer.className = "waveform-container";

  const waveform = document.createElement("div");
  waveform.className = "waveform";

  const timeLabel = document.createElement("span");
  timeLabel.className = "time-label-combined";
  timeLabel.textContent = "0:00 / 0:00";

  waveformContainer.appendChild(waveform);
  waveformContainer.appendChild(timeLabel);
  player.appendChild(playBtn);
  player.appendChild(waveformContainer);
  wrapper.appendChild(player);

  // 🕒 vaqt va ✓✓
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const time = `${hour % 12 || 12}:${minute < 10 ? "0" + minute : minute} ${hour >= 12 ? "PM" : "AM"}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.innerHTML = `${time} <span class="message-status">✓✓</span>`;

  wrapper.appendChild(meta);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const audio = new Audio(url);
  audio.preload = "metadata";
  let isPlaying = false;

  const formatTime = (sec) => `0:${sec < 10 ? "0" + sec : sec}`;
  const MAX_BARS = 40;
  const bars = [];

  for (let i = 0; i < MAX_BARS; i++) {
    const bar = document.createElement("div");
    bar.className = "wave-bar";
    bar.style.height = `${Math.random() * 18 + 4}px`;
    bar.style.flex = "1";
    waveform.appendChild(bar);
    bars.push(bar);
  }

  function updateDurationLabel(attempt = 0) {
    const sec = Math.floor(audio.duration);
    if (!isFinite(sec) || isNaN(sec) || sec === 0) {
      if (attempt < 10) {
        setTimeout(() => updateDurationLabel(attempt + 1), 300);
      } else {
        timeLabel.textContent = "0:00 / 0:00";
      }
    } else {
      timeLabel.textContent = `0:00 / ${formatTime(sec)}`;
    }
  }

  playBtn.addEventListener("click", () => {
    isPlaying ? audio.pause() : audio.play();
  });

  audio.addEventListener("loadedmetadata", updateDurationLabel);

  audio.addEventListener("timeupdate", () => {
    const cur = Math.floor(audio.currentTime);
    const total = Math.floor(audio.duration);
    timeLabel.textContent = `${formatTime(cur)} / ${formatTime(total)}`;

    const progress = audio.currentTime / audio.duration;
    const activeBars = Math.floor(progress * MAX_BARS);
    bars.forEach((bar, i) => bar.classList.toggle("playing", i < activeBars));
  });

  audio.addEventListener("play", () => {
    isPlaying = true;
    playBtn.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg fill="%231e88e5" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>')`;
  });

  audio.addEventListener("pause", () => {
    isPlaying = false;
    playBtn.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg fill="%231e88e5" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg>')`;
  });

  audio.addEventListener("ended", () => {
    isPlaying = false;
    bars.forEach(bar => bar.classList.remove("playing"));
    const total = Math.floor(audio.duration);
    timeLabel.textContent = `${formatTime(total)} / ${formatTime(total)}`;
  });
  recordedChunks = [];
}
document.getElementById('fileInput').addEventListener('change', function () {
  const file = this.files[0];
  if (file && file.type.startsWith('video/')) {
    const url = URL.createObjectURL(file);
    const modal = document.createElement('div');
    modal.className = 'video-preview-modal';
    modal.style = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #2f3136;
      padding: 16px;
      border-radius: 10px;
      z-index: 9999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      width: 320px;
      max-width: 90%;
      color: white;
    `;
    modal.innerHTML = `
      <div class="modal-content">
        <video src="${url}" controls style="width: 100%; border-radius: 8px;"></video>
        <div class="d-flex justify-content-end gap-2 mt-2">
          <button id="cancelVideo" class="btn btn-secondary">Cancel</button>
          <button id="sendVideo" class="btn btn-primary">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const resetInput = () => {
      URL.revokeObjectURL(url);
      modal.remove();
      this.value = '';
    };
    document.getElementById('cancelVideo').onclick = resetInput;
    document.getElementById('sendVideo').onclick = () => {
      appendVideoMessage(url);
      resetInput();
    };
  }
});

function appendVideoMessage(url) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble user";
  const video = document.createElement("video");
  video.src = url;
  video.controls = true;
  video.style.width = "100%";
  video.style.borderRadius = "8px";
  const meta = document.createElement("div");
  meta.className = "meta";
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  meta.innerHTML = `${time} <span style="margin-left:4px;">✓✓</span>`;
  wrapper.appendChild(video);
  wrapper.appendChild(meta);
  const chatBox = document.getElementById("chat-messages");
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}
