import os
import json
import time
import requests
from datetime import date

currencies = [
    "USD", "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG",
    "AZN", "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB",
    "BRL", "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLP",
    "CNY", "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD",
    "EGP", "ERN", "ETB", "EUR", "FJD", "FKP", "FOK", "GBP", "GEL", "GGP",
    "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG",
    "HUF", "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK", "JEP", "JMD",
    "JOD", "JPY", "KES", "KGS", "KHR", "KID", "KMF", "KRW", "KWD", "KYD",
    "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA",
    "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR",
    "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN",
    "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF",
    "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS",
    "SRD", "SSP", "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP",
    "TRY", "TTD", "TVD", "TWD", "TZS", "UAH", "UGX", "UYU", "UZS", "VES",
    "VND", "VUV", "WST", "XAF", "XCD", "XCG", "XDR", "XOF", "XPF", "YER",
    "ZAR", "ZMW", "ZWL"
];
API_KEY = "9baa0260c9a68f7223dc6737"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data.json")

def fetch_rates_for_base(base):
    try:
        res = requests.get(f"https://v6.exchangerate-api.com/v6/{API_KEY}/latest/{base}")
        data = res.json()
        if data["result"] == "success":
            return {k: data["conversion_rates"][k] for k in currencies if k != base}
    except Exception as e:
        print(f"❌ {base} xatolik: {e}")
    return {}

def fetch_today_data():
    today_str = date.today().isoformat()
    today_data = {"date": today_str, "data": {}}
    for base in currencies:
        today_data["data"][base] = fetch_rates_for_base(base)
        time.sleep(0.3)
    return today_data

def load_history():
    if os.path.exists(DATA_PATH):
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("⚠️ JSON fayl buzilgan. Qaytadan yoziladi.")
    return []

def save_history(history):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

def check_and_update():
    today = date.today().isoformat()
    history = load_history()

    if any(entry["date"] == today for entry in history):
        print("✅ Bugungi sana allaqachon mavjud.")
    else:
        print("🆕 Yangi kun boshlandi. API'dan olinmoqda...")
        today_data = fetch_today_data()
        if len(history) >= 7:
            history.pop(0)
        history.append(today_data)
        save_history(history)
        print("✅ Yangi sana qo‘shildi va saqlandi.")

if __name__ == "__main__":
    print("🔁 Monitoring boshlanmoqda...")
    while True:
        check_and_update()
        time.sleep(10)
