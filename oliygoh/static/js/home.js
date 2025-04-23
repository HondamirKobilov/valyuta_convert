const currencies00 = [
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

const fromSelect = document.getElementById("from-currency");
const toSelect = document.getElementById("to-currency");
const amountInput = document.getElementById("amount");
const resultDiv = document.getElementById("result");

const fromFlag = document.getElementById("from-flag");
const toFlag = document.getElementById("to-flag");

// ISO valyutani country code ga aylantirish (ko‘pchilikda to‘g‘ri ishlaydi)
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

function updateFlags() {
  const fromCode = currencyToCountryCode(fromSelect.value);
  const toCode = currencyToCountryCode(toSelect.value);

  fromFlag.src = `https://flagcdn.com/w40/${fromCode}.png`;
  toFlag.src = `https://flagcdn.com/w40/${toCode}.png`;
}

function populateCurrencySelects() {
  currencies00.forEach(code => {
    const fromOption = new Option(code, code);
    const toOption = new Option(code, code);
    fromSelect.appendChild(fromOption);
    toSelect.appendChild(toOption);
  });

  fromSelect.value = "USD";
  toSelect.value = "UZS";
  updateFlags();
}

async function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = document.getElementById("from-currency").value;
  const to = document.getElementById("to-currency").value;
  const resultDiv = document.getElementById("result");

  if (!amount || isNaN(amount)) {
    resultDiv.textContent = "❌ Iltimos, to‘g‘ri miqdor kiriting.";
    return;
  }

  try {
    const response = await fetch("assets/data/data.json"); // yoki "/static/assets/data/data.json"
    const data = await response.json();
    const latest = data[data.length - 1];
    const rates = latest.data;

    if (!rates[from] || !rates[from][to]) {
      resultDiv.textContent = `❌ ${from} → ${to} kursi topilmadi.`;
      return;
    }

    const result = amount * rates[from][to];
    const formatted = result.toLocaleString("en-US", { maximumFractionDigits: 2 });

    resultDiv.innerHTML = `
      <div class="alert alert-success" style="color: #0750af;">
        ✅ <strong>${amount}</strong> ${from} = <strong>${formatted}</strong> ${to}
      </div>
    `;

    // ✅ 1 soniyadan keyin sahifani avtomatik yangilash
    setTimeout(() => window.location.reload(), 1000);

  } catch (err) {
    resultDiv.textContent = "❌ Xatolik yuz berdi: " + err.message;
  }
}




// Hodisalar
fromSelect.addEventListener("change", updateFlags);
toSelect.addEventListener("change", updateFlags);

// Boshlanishida yuklash
populateCurrencySelects();
