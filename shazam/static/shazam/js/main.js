let isRecording = false;
let startTime = null;
let timerInterval;
console.log("salommmm")
const recordUI = document.getElementById('voice-record-ui');
const timeSpan = document.getElementById('recordingTime');

function startRecording() {
  isRecording = true;
  recordUI.classList.remove('d-none');
  startTime = performance.now();

  timerInterval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const deci = Math.floor((elapsed % 1000) / 100);
    timeSpan.textContent = `00:${seconds < 10 ? '0'+seconds : seconds}.${deci}`;
  }, 100);
}

function cancelRecording() {
  isRecording = false;
  clearInterval(timerInterval);
  recordUI.classList.add('d-none');
  alert('🚫 Yozish bekor qilindi');
}

function sendVoice() {
  isRecording = false;
  clearInterval(timerInterval);
  recordUI.classList.add('d-none');
  alert('✅ Yuborildi (faqat frontend)');
}