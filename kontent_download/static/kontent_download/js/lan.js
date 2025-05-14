function toggleLangMenu() {
  const menu = document.getElementById("langMenu");
  if (menu) {
    menu.classList.toggle("d-none");
  }
}

function selectLang(lang) {
  localStorage.setItem("selectedLang", lang);
  applyLanguage(lang);
  const menu = document.getElementById("langMenu");
  if (menu) {
    menu.classList.add("d-none");
  }
}

function applyLanguage(lang) {
  const t = translations[lang] || translations.en;

  // Tarjimani HTML elementlarga qo‘llash
  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.getAttribute("data-key");
    if (key && t[key]) {
      el.innerText = t[key];
    }
  });

  // Placeholder uchun
  const input = document.getElementById("messageInput");
  if (input && t.placeholder) {
    input.placeholder = t.placeholder;
  }

  // Salomlashuv xabari
  const chat = document.getElementById("chat-messages");
  if (chat && chat.firstElementChild && t.greeting) {
    chat.firstElementChild.innerText = t.greeting;
  }
}

function getLangText(key) {
  const lang = localStorage.getItem("selectedLang") || "en";
  return translations[lang]?.[key] || key;
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("selectedLang") || "en";
  applyLanguage(savedLang);
});
