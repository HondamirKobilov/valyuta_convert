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
      if (isValidURL(text)) {
        fetchAndRespondMedia(text);
      } else {
        findMusicFromText(text);
      }
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
    if (isValidURL(text)) {
      fetchAndRespondMedia(text);
    } else {
      findMusicFromText(text);
    }
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
  const apiUrl = `/kontent_download/api/fetch_instagram_media/?url=${encodeURIComponent(link)}`;
  try {
    appendMessage(getLangText("loading"), "bot");

    const res = await fetch(apiUrl);
    const data = await res.json();

    console.log("XONDAMIR>>>>>>", data)
    if (data.error) {
      console.log("888888888888888")
      appendMessage(getLangText("media_error"), "bot");
      return;
    }
    localStorage.setItem("mediaData", JSON.stringify(data));
    console.log(">>>>", data.medias)
    // YouTube uchun faqat thumbnail va format tugmalari
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      if (data.thumbnail) {
        appendBotImage(data.thumbnail, data.medias || []);
      } else {
        appendMessage(getLangText("error_unknown"), "bot");
      }
      return;
    }

    // Instagram, TikTok, Facebook uchun
    if (!data.medias || data.medias.length === 0) {
      console.log("999999999999999")
      console.log("mmmm>>>>>>",data)
      appendMessage(getLangText("media_not_found"), "bot");
      return;
    }
    console
    for (const media of data.medias) {
      if (media.type === "video") {
        appendBotVideo(media.download_url);
      } else if (media.type === "image") {
        appendBotImage(media.download_url);
      }
    }

  } catch (err) {
    console.error("API xatoligi:", err);
    appendMessage(getLangText("error_retry"), "bot");
  }
}
async function findMusicFromText(query) {
  appendMessage(getLangText("searching_music"), "bot");

  try {
    const res = await fetch(`/kontent_download/api/find_music/?query=${encodeURIComponent(query)}`, {
      method: "GET"
    });

    const data = await res.json();

    if (data.error || !data.results || data.results.length === 0) {
      appendMessage(getLangText("music_not_found"), "bot");
      return;
    }

    renderMusicList(data.results); // musiqa ro‘yxatini chiqaradi

  } catch (err) {
    console.error("Xatolik:", err);
    appendMessage(getLangText("server_error"), "bot");

  }
}


function renderMusicList(musicList) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble bot";
  wrapper.style.whiteSpace = "pre-line";

  let currentPage = 0;
  const pageSize = 10;
  const totalPages = Math.ceil(musicList.length / pageSize);

  const textDiv = document.createElement("div");
  wrapper.appendChild(textDiv);

  const btnGrid = document.createElement("div");
  btnGrid.style.display = "grid";
  btnGrid.style.gridTemplateColumns = "repeat(5, 1fr)";
  btnGrid.style.gap = "6px";
  btnGrid.style.marginTop = "10px";

  // 🔁 Sahifalash tugmalari (⏮ ❌ ⏭)
  const navGrid = document.createElement("div");
  navGrid.style.display = "grid";
  navGrid.style.gridTemplateColumns = "1fr 1fr 1fr";
  navGrid.style.gap = "8px";
  navGrid.style.marginTop = "12px";

  const prevBtn = document.createElement("button");
  prevBtn.className = "btn btn-outline-secondary";
  prevBtn.textContent = "⏮";
  prevBtn.onclick = () => {
    if (currentPage > 0) {
      currentPage--;
      renderPage();
    }
  };

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-outline-danger";
  closeBtn.textContent = "❌";
  closeBtn.onclick = () => wrapper.remove();

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn-outline-secondary";
  nextBtn.textContent = "⏭";
  nextBtn.onclick = () => {
    if ((currentPage + 1) < totalPages) {
      currentPage++;
      renderPage();
    }
  };
  navGrid.appendChild(prevBtn);
  navGrid.appendChild(closeBtn);
  navGrid.appendChild(nextBtn);
  wrapper.appendChild(btnGrid);
  wrapper.appendChild(navGrid);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  function renderPage() {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    const pageItems = musicList.slice(start, end);

    const listText = pageItems.map((item, index) => {
      const minutes = Math.floor(item.duration / 60);
      const seconds = item.duration % 60;
      const time = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      const realIndex = start + index + 1;
      return `${realIndex}. ${item.title} ${time}`;
    }).join('\n');

    textDiv.textContent = listText;

    btnGrid.innerHTML = "";
    pageItems.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-info music-btn";
      // btn.textContent = start + index + 1 + "🎵";
      btn.innerHTML = `${start + index + 1} <span class="note-icon">🎵</span>`;
      btn.onclick = () => {
        appendBotMusic(item.url, item.title, item.performer, item.duration);
      };
      btnGrid.appendChild(btn);
    });
  }
  renderPage();
}

function appendBotMusic(url, title = "Nomaʼlum", performer = "", duration = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble bot";
  wrapper.style.background = "#1c1f26";
  wrapper.style.borderRadius = "12px";
  wrapper.style.padding = "14px";
  wrapper.style.color = "#fff";
  wrapper.style.maxWidth = "340px";
  wrapper.style.fontFamily = "sans-serif";
  wrapper.style.marginBottom = "12px";
  wrapper.style.position = "relative";

  const audio = new Audio(url);
  let isPlaying = false;
  let isSeeking = false;

  const playBtn = document.createElement("div");
  playBtn.innerHTML = "▶️";
  playBtn.style.fontSize = "20px";
  playBtn.style.background = "#0074D9";
  playBtn.style.width = "44px";
  playBtn.style.height = "44px";
  playBtn.style.borderRadius = "50%";
  playBtn.style.display = "inline-flex";
  playBtn.style.alignItems = "center";
  playBtn.style.justifyContent = "center";
  playBtn.style.cursor = "pointer";
  playBtn.style.marginRight = "12px";
  playBtn.style.flexShrink = "0";

  const titleBlock = document.createElement("div");
  const timeLabel = document.createElement("div");
  timeLabel.style.fontSize = "12px";
  timeLabel.style.color = "#aaa";
  timeLabel.textContent = "0:00 / 0:00";
  titleBlock.innerHTML = `<strong>${title}</strong>`;
  titleBlock.appendChild(timeLabel);

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.appendChild(playBtn);
  header.appendChild(titleBlock);

  const progress = document.createElement("input");
  progress.type = "range";
  progress.min = 0;
  progress.value = 0;
  progress.style.width = "100%";
  progress.style.marginTop = "10px";
  progress.style.appearance = "none";
  progress.style.height = "2px";
  progress.style.background = "#666";
  progress.style.borderRadius = "2px";
  progress.style.outline = "none";
  progress.style.cursor = "pointer";

  const note = document.createElement("div");
  note.textContent = "@Shazam_mbot orqali istagan musiqangizni tez va oson toping!";
  note.style.fontSize = "13px";
  note.style.color = "#ccc";
  note.style.marginTop = "10px";

  const messageTime = document.createElement("div");
  messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messageTime.style.fontSize = "12px";
  messageTime.style.color = "#666";
  messageTime.style.position = "absolute";
  messageTime.style.bottom = "10px";
  messageTime.style.right = "14px";

  const joinLink = document.createElement("a");
  joinLink.href = "https://t.me/Shazam_mbot?startgroup=true";
  joinLink.textContent = "Guruhga qo‘shish 🎵";
  joinLink.target = "_blank";
  joinLink.style.display = "inline-block";
  joinLink.style.width = "100%";
  joinLink.style.textAlign = "center";
  joinLink.style.marginTop = "12px";
  joinLink.style.padding = "6px";
  joinLink.style.border = "1px solid #aaa";
  joinLink.style.borderRadius = "6px";
  joinLink.style.color = "#ccc";
  joinLink.style.textDecoration = "none";
  joinLink.onmouseover = () => joinLink.style.background = "#4e4d4d";
  joinLink.onmouseout = () => joinLink.style.background = "transparent";

  // 🔻 Yuklab olish va Ulashish tugmalari
  const buttonWrapper = document.createElement("div");
  buttonWrapper.style.display = "flex";
  buttonWrapper.style.justifyContent = "space-between";
  buttonWrapper.style.gap = "10px";
  buttonWrapper.style.marginTop = "10px";

  // 📥 Yuklab olish tugmasi
  const downloadBtn = document.createElement("a");
  downloadBtn.textContent = "📥 Yuklab olish";
  downloadBtn.style.flex = "1";
  downloadBtn.style.textAlign = "center";
  downloadBtn.style.padding = "6px";
  downloadBtn.style.border = "1px solid #aaa";
  downloadBtn.style.borderRadius = "6px";
  downloadBtn.style.color = "#ccc";
  downloadBtn.style.textDecoration = "none";
  downloadBtn.style.background = "transparent";
  downloadBtn.style.cursor = "pointer";
  downloadBtn.onmouseover = () => downloadBtn.style.background = "#4e4d4d";
  downloadBtn.onmouseout = () => downloadBtn.style.background = "transparent";
  console.log("asddwqff>>>", url)
  let hasLoaded = false; // bir marta yuklanganligini belgilaydi
  let blobUrl = null;

  playBtn.onclick = async () => {
    if (!hasLoaded) {
      playBtn.innerHTML = "⏬"; // Yuklanmoqda belgisi

      const progressText = document.createElement("div");
      progressText.style.fontSize = "12px";
      progressText.style.color = "#aaa";
      progressText.style.marginTop = "5px";
      progressText.textContent = "0.0 / ... MB";
      wrapper.insertBefore(progressText, note); // progress matnini joylash

      try {
        const res = await fetch(`/download_music/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
        if (!res.ok || !res.body) {
          playBtn.innerHTML = "❌";
          progressText.textContent = "Yuklab bo‘lmadi";
          return;
        }

        const total = parseInt(res.headers.get("content-length") || "0");
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;

          const mbNow = (received / 1024 / 1024).toFixed(1);
          const mbTotal = total ? (total / 1024 / 1024).toFixed(1) : "...";
          progressText.textContent = `${mbNow} / ${mbTotal} MB`;
        }

        const blob = new Blob(chunks, { type: "audio/mpeg" });
        blobUrl = URL.createObjectURL(blob);

        audio.src = blobUrl;
        hasLoaded = true;

        // Faollashtiramiz
        downloadBtn.href = blobUrl;
        downloadBtn.download = title.replace(/\s+/g, "_") + ".mp3";
        playBtn.innerHTML = "⏸️";
        audio.play();
        isPlaying = true;
        progressText.remove(); // progress yozuvini o‘chirish

      } catch (err) {
        playBtn.innerHTML = "❌";
        progressText.textContent = "Xatolik: " + err.message;
      }

      return;
    }

    // Agar fayl yuklangan bo‘lsa — oddiy play/pause ishlaydi
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };



  // 🔗 Ulashish tugmasi
  const shareBtn = document.createElement("button");
  shareBtn.textContent = "🔗 Ulashish";
  shareBtn.style.flex = "1";
  shareBtn.style.textAlign = "center";
  shareBtn.style.padding = "6px";
  shareBtn.style.border = "1px solid #aaa";
  shareBtn.style.borderRadius = "6px";
  shareBtn.style.color = "#ccc";
  shareBtn.style.background = "transparent";
  shareBtn.style.cursor = "pointer";
  shareBtn.onmouseover = () => shareBtn.style.background = "#4e4d4d";
  shareBtn.onmouseout = () => shareBtn.style.background = "transparent";

  shareBtn.onclick = () => {
    navigator.clipboard.writeText(url).then(() => {
      shareBtn.textContent = "✅ Nusxalandi";
      setTimeout(() => {
        shareBtn.textContent = "🔗 Ulashish";
      }, 1500);
    });
  };

  buttonWrapper.appendChild(downloadBtn);
  buttonWrapper.appendChild(shareBtn);

  playBtn.onclick = () => {
    isPlaying ? audio.pause() : audio.play();
  };

  audio.addEventListener("loadedmetadata", () => {
    progress.max = Math.floor(audio.duration);
    timeLabel.textContent = `0:00 / ${formatTime(audio.duration)}`;
  });

  audio.addEventListener("play", () => {
    isPlaying = true;
    playBtn.innerHTML = "⏸️";
  });

  audio.addEventListener("pause", () => {
    isPlaying = false;
    playBtn.innerHTML = "▶️";
  });

  progress.addEventListener("input", () => {
    isSeeking = true;
    audio.currentTime = progress.value;
  });

  progress.addEventListener("change", () => {
    audio.currentTime = progress.value;
    isSeeking = false;
  });

  audio.addEventListener("timeupdate", () => {
    if (!isSeeking) {
      progress.value = Math.floor(audio.currentTime);
      timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
  });

  function formatTime(sec) {
    sec = Math.floor(sec);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  }

  wrapper.appendChild(header);
  wrapper.appendChild(progress);
  wrapper.appendChild(note);
  wrapper.appendChild(messageTime);
  wrapper.appendChild(joinLink);
  wrapper.appendChild(buttonWrapper);

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendBotImage(url, medias = [], originalUrl = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-bubble bot";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.width = "50%";
  const img = document.createElement("img");
  img.src = url;
  img.alt = "image";
  img.style.width = "100%";
  img.style.borderRadius = "8px";
  wrapper.appendChild(img);

  const buttonGroup = document.createElement("div");
  buttonGroup.style.display = "flex";
  buttonGroup.style.gap = "10px";
  buttonGroup.style.marginTop = "8px";

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "⬇️ Saqlash";
  downloadBtn.className = "btn btn-success";
  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "image.jpg";
    a.click();
  };

  const shareBtn = document.createElement("button");
  shareBtn.textContent = "📤 Ulashish";
  shareBtn.className = "btn btn-primary";
  shareBtn.onclick = () => {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.openTelegramLink("https://t.me/YouTubeDanYuklovchiBot?start=image");
    } else {
      alert("Telegram WebApp muhitida ishlamayapti.");
    }
  };

  buttonGroup.style.display = "flex";
  buttonGroup.style.flexWrap = "wrap";
  buttonGroup.style.justifyContent = "center";
  buttonGroup.style.gap = "8px";
  buttonGroup.style.marginTop = "10px";


  downloadBtn.textContent = "⬇️ Saqlash";
  downloadBtn.className = "btn btn-success";
  downloadBtn.style.flex = "1 1 120px";


  shareBtn.textContent = "📤 Ulashish";
  shareBtn.className = "btn btn-primary";
  shareBtn.style.flex = "1 1 120px";
  buttonGroup.appendChild(downloadBtn);
  buttonGroup.appendChild(shareBtn);
  wrapper.appendChild(buttonGroup);

  if (medias.length > 0) {
    const allowedQualities = [
      // 144p
      "144", "144p", "144p15", "144p30", "(144)", "(144p)", "144)", "(144p15)", "(144p30)",

      // 240p
      "240", "240p", "240p30", "(240)", "(240p)", "240)", "(240p30)",

      // 360p
      "360", "360p", "360p30", "360p60", "(360)", "(360p)", "360)", "(360p30)", "(360p60)",

      // 480p
      "480", "480p", "480p30", "(480)", "(480p)", "480)", "(480p30)",

      // 720p
      "720", "720p", "720p30", "720p60", "(720)", "(720p)", "720)", "(720p30)", "(720p60)",

      // 1080p
      "1080", "1080p", "1080p30", "1080p60", "1080p HDR", "(1080)", "(1080p)", "1080)", "(1080p30)", "(1080p60)", "(1080p HDR)",

      // 1440p (2K)
      "1440", "1440p", "1440p30", "1440p60", "(1440)", "(1440p)", "1440)", "(1440p30)", "(1440p60)",

      // 2160p (4K)
      "2160", "2160p", "2160p30", "2160p60", "2160p HDR", "(2160)", "(2160p)", "2160)", "(2160p30)", "(2160p60)", "(2160p HDR)",

      // 4320p (8K)
      "4320", "4320p", "4320p30", "4320p60", "(4320)", "(4320p)", "4320)", "(4320p30)", "(4320p60)"
    ];

    const seen = new Set();

    const filtered = medias.filter(m => {
      const ext = m.ext || m.url.split('.').pop().split('?')[0].toLowerCase();
      const type = m.type;
      const quality = m.quality || "";

      if (type !== "video") {
        console.log(`❌ SKIPPED: type != video =>`, m);
        return false;
      }

      if (ext !== "mp4") {
        console.log(`❌ SKIPPED: ext != mp4 (aniqlangan ext: ${ext}) =>`, m);
        return false;
      }

      const matchedQuality = allowedQualities.find(q => quality.includes(q));
      if (!matchedQuality) {
        console.log(`❌ SKIPPED: noto'g'ri quality =>`, quality, m);
        return false;
      }

      if (seen.has(matchedQuality)) {
        console.log(`❌ SKIPPED: duplicate quality ${matchedQuality} =>`, m);
        return false;
      }

      seen.add(matchedQuality);
      m.normalizedQuality = matchedQuality;
      console.log(`✅ PASSED: ${matchedQuality}p =>`, m);
      return true;
    });

    filtered.sort((a, b) => parseInt(a.normalizedQuality) - parseInt(b.normalizedQuality));

    const btnGroup = document.createElement("div");
    btnGroup.style.display = "grid";
    btnGroup.style.gridTemplateColumns = "1fr 1fr";
    btnGroup.style.gap = "6px";
    btnGroup.style.marginTop = "8px";
    btnGroup.style.width = "100%";

    filtered.forEach(media => {
      const btn = document.createElement("button");
      btn.textContent = `${media.normalizedQuality}p`;
      btn.className = "btn btn-primary";
      btn.style.width = "100%";

      btn.onclick = async () => {
        wrapper.remove();
        appendMessage(getLangText("video_processing"), "bot");

        const mediaData = JSON.parse(localStorage.getItem("mediaData"));
        if (!mediaData) {
          appendMessage(getLangText("media_not_found1"), "bot");
          return;
        }

        const res = await fetch("/kontent_download/api/download_video/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            quality: `${media.normalizedQuality}p`,
            videoData: mediaData,
            url: originalUrl
          })
        });
        if (!res.ok) {
          appendMessage(getLangText("video_failed"), "bot");
          return;
        }

        const contentType = res.headers.get("Content-Type") || "";

        if (contentType.includes("application/json")) {
          const data = await res.json();
          if (data.url) {
            appendBotVideo(data.url);  // 360p holati
          } else {
            appendMessage(getLangText("url_not_found"), "bot");
          }
        } else if (contentType.includes("video/mp4")) {
          const blob = await res.blob();
          const videoUrl = URL.createObjectURL(blob);
          appendBotVideo(videoUrl);  // Birlashgan holat
        } else {
          appendMessage(getLangText("unknown_response_format"), "bot");
        }
      };

      btnGroup.appendChild(btn);
    });


    wrapper.appendChild(btnGroup);
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })} <span style="margin-left:4px;"></span>`;
    wrapper.appendChild(meta);
  }

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


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
  const meta = `<div class="message-meta">${time} <span class="message-status"></span></div>`;
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
  video.setAttribute("type", "video/mp4");

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `${new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })} <span style="margin-left:4px;"></span>`;

  // Tugma konteyneri
  const buttonGroup = document.createElement("div");
  buttonGroup.style.display = "flex";
  buttonGroup.style.gap = "10px";
  buttonGroup.style.marginTop = "8px";

  // Saqlash tugmasi
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "⬇️ Saqlash";
  downloadBtn.className = "btn btn-success";
  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "video.mp4";
    a.click();
  };

  // Ulashish tugmasi (Telegram WebApp)
  const shareBtn = document.createElement("button");
  shareBtn.textContent = "📤 Ulashish";
  shareBtn.className = "btn btn-primary";
  shareBtn.onclick = () => {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.openTelegramLink("https://t.me/YouTubeDanYuklovchiBot?start=video");
    } else {
      alert("Telegram WebApp muhitida ishlamayapti.");
    }
  };

  buttonGroup.appendChild(downloadBtn);
  buttonGroup.appendChild(shareBtn);

  wrapper.appendChild(video);
  wrapper.appendChild(buttonGroup);
  wrapper.appendChild(meta);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


// function appendBotImage(url) {
//   const wrapper = document.createElement("div");
//   wrapper.className = "chat-bubble bot";
//   const img = document.createElement("img");
//   img.src = url;
//   img.alt = "image";
//   img.style.width = "100%";
//   img.style.borderRadius = "8px";
//   const meta = document.createElement("div");
//   meta.className = "meta";
//   meta.innerHTML = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <span style="margin-left:4px;">✓✓</span>`;
//   wrapper.appendChild(img);
//   wrapper.appendChild(meta);
//   chatMessages.appendChild(wrapper);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// }


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
  meta.innerHTML = `${time} <span style="margin-left:4px;"></span>`;
  wrapper.appendChild(video);
  wrapper.appendChild(meta);
  const chatBox = document.getElementById("chat-messages");
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}



document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("messageInput");
  const wrapper = document.querySelector(".chat-wrapper");

  if (!textarea || !wrapper) return;

  textarea.addEventListener("focus", () => {
    // Faqat telefon uchun: width <= 480px
    if (window.innerWidth <= 480) {
      wrapper.classList.add("expanded");
    }
  });

  textarea.addEventListener("blur", () => {
    if (window.innerWidth <= 480) {
      wrapper.classList.remove("expanded");
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 480) {
      wrapper.classList.remove("expanded");
    }
  });
});

