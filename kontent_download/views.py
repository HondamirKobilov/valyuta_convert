import json
import traceback

import requests
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Content, Download, User
from .serializers import ContentSerializer


BOT_TOKEN = "7602584815:AAELNp5Dib7HFLMEL1oRwPLdnzC5kuXdLnY"  # Bot tokenni shu yerga yoz
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
def index(request):
    return render(request, 'shazam/index.html')

class CheckOrCreateContentView(APIView):
    def post(self, request):
        data = request.data
        source_link = data.get('source_link')
        file_uid = data.get('file_unique_id')
        content_type = data.get('content_type')
        platform = data.get('platform')
        mime_type = data.get('mime_type')
        user_id = data.get('user_id')  # foydalanuvchi telegram_id
        chat_id = data.get('chat_id')  # telegram chat_id

        # 🔍 1. Tekshir — bazada bor yoki yo‘q
        existing = None
        if source_link:
            existing = Content.objects.filter(source_link=source_link).first()
        elif file_uid:
            existing = Content.objects.filter(file_unique_id=file_uid).first()

        if existing:
            return Response(ContentSerializer(existing).data, status=200)

        # 📥 2. Hali mavjud emas — kontentni yuklab olamiz (bu yerda test uchun mock link)
        # TODO: Real yuklab olishni qo‘shing (Insta, TikTok, YouTube)
        mock_file_url = "https://file-examples.com/wp-content/uploads/2017/04/file_example_MP4_480_1_5MG.mp4"

        # 📤 3. Telegram botga kontentni yuboramiz
        BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
        telegram_api_url = f"https://api.telegram.org/bot{BOT_TOKEN}"

        send_url = f"{telegram_api_url}/sendVideo" if content_type == "video" else f"{telegram_api_url}/sendDocument"

        response = requests.post(send_url, data={
            "chat_id": chat_id,
            "caption": f"✅ {platform.capitalize()} kontenti yuklandi",
            "disable_notification": True
        }, files={
            "video" if content_type == "video" else "document": requests.get(mock_file_url, stream=True).raw
        })

        if response.status_code != 200:
            return Response({"error": "Telegramga yuborishda xatolik"}, status=500)

        response_json = response.json()
        result = response_json["result"]

        # 🎯 4. file_id ni ajratib olamiz
        telegram_file_id = result.get(content_type, result).get("file_id")
        file_unique_id = result.get(content_type, result).get("file_unique_id")

        # 💾 5. Bazaga yozamiz
        new_content = Content.objects.create(
            source_link=source_link,
            content_type=content_type,
            platform=platform,
            telegram_file_id=telegram_file_id,
            mime_type=mime_type,
            file_unique_id=file_unique_id
        )
        return Response(ContentSerializer(new_content).data, status=201)

@csrf_exempt
def send_message_to_bot(request):
    try:
        if request.method != 'POST':
            return JsonResponse({"error": "Faqat POST so‘rovi qo‘llaniladi"}, status=405)

        print("✅ So‘rov turi:", request.content_type)

        # ==== JSON - faqat matn yuborish ====
        if request.content_type.startswith("application/json"):
            data = json.loads(request.body)
            chat_id = data.get("chat_id")
            text = data.get("text", "")
            sender = data.get("sender", "")

            msg = f"{sender}:\n{text}" if sender else text
            print("📨 Yuborilayotgan matn:", msg)

            response = requests.post(f"{API_URL}/sendMessage", json={
                "chat_id": chat_id,
                "text": msg
            })

            return JsonResponse({"ok": response.ok})

        # ==== Multipart - media fayl yuborish ====
        elif request.content_type.startswith("multipart/form-data"):
            chat_id = request.POST.get("chat_id")
            sender = request.POST.get("sender", "")
            file_type = request.POST.get("type")

            file = request.FILES.get(file_type)
            if not file:
                print("❌ Fayl topilmadi.")
                return JsonResponse({"error": "Fayl topilmadi"}, status=400)

            print("📂 Fayl turi:", file_type)
            print("📥 Fayl nomi:", file.name)

            telegram_method = {
                "voice": "sendVoice",
                "audio": "sendAudio",
                "photo": "sendPhoto",
                "video": "sendVideo",
                "document": "sendDocument"
            }.get(file_type)

            if not telegram_method:
                print("❌ Nomaʼlum media turi:", file_type)
                return JsonResponse({"error": "Nomaʼlum media turi"}, status=400)

            files = {file_type: (file.name, file.read())}
            data = {"chat_id": chat_id}
            if sender:
                data["caption"] = f"{sender}dan"

            print(f"📤 {telegram_method} orqali yuborilmoqda...")
            response = requests.post(f"{API_URL}/{telegram_method}", data=data, files=files)

            return JsonResponse({"ok": response.ok, "status_code": response.status_code})

        return JsonResponse({"error": "Nomaʼlum content-type"}, status=400)

    except Exception as e:
        print("❌ Xatolik:", str(e))
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def telegram_auth(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            telegram_id = data.get('id')  # ✅ Telegram user ID
            username = data.get('username')
            first_name = data.get('first_name')

            if not telegram_id:
                return JsonResponse({'error': 'ID topilmadi'}, status=400)

            # 🔥 Telegram ID ni sessionda saqlab qo'yamiz
            request.session['chat_id'] = telegram_id

            return JsonResponse({'status': 'ok', 'chat_id': telegram_id})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Faqat POST ruxsat etiladi'}, status=405)