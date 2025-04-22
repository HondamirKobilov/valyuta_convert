const currencyData = [
  { code: "USD", name: "AQSH dollari", flag: "🇺🇸" },
  { code: "EUR", name: "Yevro", flag: "🇪🇺" },
  { code: "RUB", name: "Rossiya rubli", flag: "🇷🇺" },
  { code: "GBP", name: "Angliya funti", flag: "🇬🇧" },
  { code: "CNY", name: "Xitoy yuani", flag: "🇨🇳" },
  { code: "JPY", name: "Yaponiya iyenasi", flag: "🇯🇵" }
];

async function renderCurrencyCards() {
  const list = document.getElementById("currency-list");
  list.innerHTML = "";

  try {
    const res = await fetch("/static/assets/data/data.json");
    const jsonData = await res.json();
    const rates = jsonData.at(-1).data; // eng oxirgi kun

    currencyData.forEach(val => {
      const rate = rates[val.code]?.UZS; // 1 valyuta = ? UZS
      if (!rate) return;

      const card = document.createElement("div");
      card.className = "col";

      card.innerHTML = `
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body text-center">
            <div class="fs-1 mb-2">${val.flag}</div>
            <h5 class="card-title">${val.name}</h5>
            <p class="card-text text-muted mb-1">${val.code}</p>
            <div class="fw-bold fs-5 text-primary">${rate.toLocaleString()} so‘m</div>
          </div>
        </div>
      `;

      list.appendChild(card);
    });

  } catch (error) {
    console.error("❌ JSON o'qishda xatolik:", error);
    list.innerHTML = `<div class="alert alert-danger">Valyuta ma'lumotlarini yuklab bo‘lmadi.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", renderCurrencyCards);
