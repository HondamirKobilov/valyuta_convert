import json

def print_dates_list(path):
    try:
        with open(path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        for i, entry in enumerate(data, start=1):
            print(f"{i}. {entry.get('date', 'Sana topilmadi')}")

    except FileNotFoundError:
        print("❌ Fayl topilmadi.")
    except json.JSONDecodeError:
        print("❌ JSON formatida xatolik bor.")
    except Exception as e:
        print(f"❌ Xatolik yuz berdi: {e}")

# Ishlatish:
print_dates_list("data.json")
