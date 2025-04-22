const currencies1 = [
  "USD", "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM", "BBD",
  "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD",
  "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP",
  "DZD", "EGP", "ERN", "ETB", "EUR", "FJD", "FKP", "FOK", "GBP", "GEL", "GGP", "GHS", "GIP",
  "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF", "IDR", "ILS", "IMP", "INR",
  "IQD", "IRR", "ISK", "JEP", "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KID", "KMF", "KRW",
  "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD",
  "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO",
  "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON",
  "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS",
  "SRD", "SSP", "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TVD",
  "TWD", "TZS", "UAH", "UGX", "UYU", "UZS", "VES", "VND", "VUV", "WST", "XAF", "XCD", "XCG",
  "XDR", "XOF", "XPF", "YER", "ZAR", "ZMW", "ZWL"
];

let historyChart;

// 🌍 Maxsus flag exceptions
function currencyToCountryCode(currency) {
  const exceptions = {
    EUR: "eu",
    USD: "us",
    GBP: "gb",
    UZS: "uz",
    RUB: "ru",
    CNY: "cn",
    JPY: "jp",
    KRW: "kr"
  };
  return (exceptions[currency] || currency.slice(0, 2)).toLowerCase();
}

// 🏳 Bayroqlarni yangilash
function updateHistoryFlags() {
  const base = document.getElementById("baseCurrency").value;
  const target = document.getElementById("targetCurrency").value;

  const fromCode = currencyToCountryCode(base);
  const toCode = currencyToCountryCode(target);

  document.getElementById("history-from-flag").src = `https://flagcdn.com/w40/${fromCode}.png`;
  document.getElementById("history-to-flag").src = `https://flagcdn.com/w40/${toCode}.png`;
}

// 🔁 Select elementlarini valyutalar bilan to‘ldirish
function fillHistoryCurrencySelects() {
  const baseSelect = document.getElementById("baseCurrency");
  const targetSelect = document.getElementById("targetCurrency");

  currencies1.forEach(code => {
    baseSelect.appendChild(new Option(code, code));
    targetSelect.appendChild(new Option(code, code));
  });

  baseSelect.value = "USD";
  targetSelect.value = "UZS";
}

// 📊 Grafik chizish
async function loadHistoryChart() {
  const base = document.getElementById("baseCurrency").value;
  const target = document.getElementById("targetCurrency").value;
  const response = await fetch("/static/assets/data/data.json");
  const jsonData = await response.json();

  const labels = [];
  const dataPoints = [];

  jsonData.forEach(entry => {
    const date = entry.date;
    const rate = entry.data?.[base]?.[target];
    if (rate) {
      labels.push(date);
      dataPoints.push(rate);
    }
  });

  const ctx = document.getElementById("history-chart").getContext("2d");

  if (historyChart) {
    historyChart.destroy();
  }

  historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: `${base} → ${target}`,
        data: dataPoints,
        borderColor: "#1e4eff",
        backgroundColor: "rgba(30, 78, 255, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#1e4eff"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: {
          ticks: {
            color: document.body.classList.contains("dark-mode") ? "#fff" : "#000"
          },
          beginAtZero: false
        },
        x: {
          ticks: {
            color: document.body.classList.contains("dark-mode") ? "#fff" : "#000"
          }
        }
      }
    }
  });
}

// 🚀 Dastlabki ishga tushirish
document.addEventListener("DOMContentLoaded", () => {
  fillHistoryCurrencySelects();
  updateHistoryFlags();
  loadHistoryChart();

  document.getElementById("baseCurrency").addEventListener("change", () => {
    updateHistoryFlags();
    loadHistoryChart();
  });

  document.getElementById("targetCurrency").addEventListener("change", () => {
    updateHistoryFlags();
    loadHistoryChart();
  });
});
