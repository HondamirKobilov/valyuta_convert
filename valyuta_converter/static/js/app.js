function changeLang(lang) {
  const t = translations[lang];

  document.getElementById("converter_title").textContent = t.title;
  document.getElementById("converter_subtitle").textContent = t.subtitle;
  document.getElementById("label_from").textContent = t.from;
  document.getElementById("label_to").textContent = t.to;
  document.getElementById("convert_btn").textContent = t.convert;

  const amountInput = document.getElementById("amount");
  if (amountInput) amountInput.placeholder = t.placeholder;

  // Header nav
  document.getElementById("nav_home").textContent = t.nav_home;
  document.getElementById("nav_currencies").textContent = t.nav_currencies;
  document.getElementById("nav_history").textContent = t.nav_history;
  document.getElementById("nav_news").textContent = t.nav_news;
  document.getElementById("nav_about").textContent = t.nav_about;

  // Footer
  document.getElementById("banner_title").textContent = t.banner_title;
  document.getElementById("footer_section1_title").textContent = t.section1_title;
  document.getElementById("footer_nav_home").textContent = t.nav_home1;
  document.getElementById("footer_nav_currencies").textContent = t.nav_currencies1;
  document.getElementById("footer_nav_history").textContent = t.nav_history1;
  document.getElementById("footer_nav_news").textContent = t.nav_news1;
  document.getElementById("footer_nav_about").textContent = t.nav_about1;
  document.getElementById("footer_section2_title").textContent = t.section2_title;
  document.getElementById("footer_location").textContent = t.location;
  document.getElementById("footer_email").textContent = t.email;
  document.getElementById("footer_phone").textContent = t.phone;
  document.getElementById("footer_section3_title").textContent = t.section3_title;
  document.getElementById("footer_copy").textContent = t.footer_copy;
  document.getElementById("footer_contact").childNodes[0].textContent = t.footer_contact;

  // History section
  document.getElementById("history_title").textContent = t.history_title;
  document.getElementById("history_from_label").textContent = t.history_from_label;
  document.getElementById("history_to_label").textContent = t.history_to_label;
  document.getElementById("history_description").textContent = t.history_description;

  // News
  document.getElementById("news_title").textContent = t.news_title;
  document.getElementById("news_1_title").textContent = t.news_1_title;
  document.getElementById("news_1_text").textContent = t.news_1_text;
  document.getElementById("news_1_btn").textContent = t.news_1_btn;
  document.getElementById("news_2_title").textContent = t.news_2_title;
  document.getElementById("news_2_text").textContent = t.news_2_text;
  document.getElementById("news_2_btn").textContent = t.news_2_btn;
  document.getElementById("news_3_title").textContent = t.news_3_title;
  document.getElementById("news_3_text").textContent = t.news_3_text;
  document.getElementById("news_3_btn").textContent = t.news_3_btn;
  document.getElementById("news_4_title").textContent = t.news_4_title;
  document.getElementById("news_4_text").textContent = t.news_4_text;
  document.getElementById("news_4_btn").textContent = t.news_4_btn;

  // About
  document.getElementById("about_title").textContent = t.about_title;
  document.getElementById("about_description").textContent = t.about_description;
  document.getElementById("about_feature_1").textContent = t.about_feature_1;
  document.getElementById("about_feature_2").textContent = t.about_feature_2;
  document.getElementById("about_feature_3").textContent = t.about_feature_3;
  document.getElementById("about_feature_4").textContent = t.about_feature_4;
}



// ✅ Til tanlanganida qo‘llash va saqlash
function selectLang(lang) {
  const langNames = {
    uz: "O‘zbekcha",
    en: "English",
    ru: "Русский"
  };

  const selectedText = document.getElementById("langSelectedText");
  if (selectedText) {
    selectedText.textContent = langNames[lang];
  }

  changeLang(lang);
  localStorage.setItem("lang", lang);

  const menu = document.getElementById("langMenu");
  if (menu) menu.classList.add("d-none");
}

function navigateTo(pageId) {
  localStorage.setItem("activePage", pageId);
  location.reload(); // sahifani tozalab qaytadan yuklaydi
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(section => {
    section.classList.add('d-none');
  });

  const activePage = document.getElementById(pageId);
  if (activePage) {
    activePage.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`[onclick="navigateTo('${pageId}')"]`);
  if (activeLink) activeLink.classList.add('active');
}

// ✅ Sahifa yuklanganda
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const themeDesktop = document.getElementById("themeToggleDesktop");
  const themeMobile = document.getElementById("themeToggleMobile");
  const customToggler = document.querySelector(".custom-toggler");
  const langTrigger = document.querySelector(".lang-trigger");
  const langMenu = document.getElementById("langMenu");

  // 🌗 Tema
  const setTheme = (mode) => {
    if (mode === "dark") {
      body.classList.add("dark-mode");
      if (themeDesktop) themeDesktop.textContent = "🔆";
      if (themeMobile) themeMobile.textContent = "🔆";
    } else {
      body.classList.remove("dark-mode");
      if (themeDesktop) themeDesktop.textContent = "🌙";
      if (themeMobile) themeMobile.textContent = "🌙";
    }
    localStorage.setItem("theme", mode);
  };

  const savedTheme = localStorage.getItem("theme");
  setTheme(savedTheme === "dark" ? "dark" : "light");

  [themeDesktop, themeMobile].forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        const isDark = body.classList.contains("dark-mode");
        setTheme(isDark ? "light" : "dark");
      });
    }
  });

  if (customToggler) {
    customToggler.addEventListener("click", () => {
      customToggler.classList.toggle("active");
    });
  }

  // 🌐 Til menyusi
  if (langTrigger && langMenu) {
    langTrigger.addEventListener("click", () => {
      langMenu.classList.toggle("d-none");
    });

    document.addEventListener("click", (e) => {
      if (!langTrigger.contains(e.target) && !langMenu.contains(e.target)) {
        langMenu.classList.add("d-none");
      }
    });
  }

  const langSelectedText = document.getElementById("langSelectedText");
  if (langSelectedText) {
    langSelectedText.textContent = {
      uz: "O‘zbekcha",
      en: "English",
      ru: "Русский"
    }[savedLang];
  }

  const savedPage = localStorage.getItem("activePage") || "home";
  showPage(savedPage);
});