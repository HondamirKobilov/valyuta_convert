import asyncio
import json
import re
import subprocess
import httpx
from b2sdk.v0 import InMemoryAccountInfo, B2Api
import requests
from django.db import IntegrityError
from django.http import JsonResponse, StreamingHttpResponse, HttpResponse, FileResponse
from django.shortcuts import render
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from kontent_download.models import DownloadedMedia
from asgiref.sync import sync_to_async
from io import BytesIO

from kontent_download.uploads.queue import pending_uploads


KEY_ID = "a30c6bd1bcc5"
APPLICATION_KEY = "003bfeaf835a36e9e5b65c3f13f1607c4ca18ced0b"
BUCKET_NAME = "server777"

def index(request):
    return render(request, 'kontent_download/index.html')

def get_b2_bucket():
    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    b2_api.authorize_account("production", KEY_ID, APPLICATION_KEY)
    return b2_api.get_bucket_by_name(BUCKET_NAME)

def index(request):
    return render(request, 'kontent_download/index.html')

def merge_streams(video_url, audio_url, output_path):
    ffmpeg = getattr(settings, "FFMPEG_PATH", "ffmpeg")  # fallback
    command = [
        ffmpeg,
        "-i", video_url,
        "-i", audio_url,
        "-c:v", "copy",
        "-c:a", "aac",
        "-y",
        output_path
    ]
    print("▶️ FFmpeg command:", ' '.join(command))
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    print("📥 STDOUT:\n", result.stdout)
    print("❗ STDERR:\n", result.stderr)

    if result.returncode != 0:
        raise Exception("FFmpeg bajarilmadi")
@sync_to_async
def get_cached_media(url):
    return DownloadedMedia.objects.filter(url=url).first()
@sync_to_async
def is_file_in_bucket(file_name):
    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    b2_api.authorize_account("production", KEY_ID, APPLICATION_KEY)
    bucket = b2_api.get_bucket_by_name(BUCKET_NAME)

    try:
        bucket.get_file_info_by_name(file_name)
        return True
    except Exception:
        return False

@sync_to_async
def save_media_to_db(url, filename):
    try:
        obj, created = DownloadedMedia.objects.get_or_create(
            url=url,
            defaults={"filename": filename}
        )
        return created  # True: yangi qo‘shildi, False: allaqachon bor
    except IntegrityError:
        # Boshqa process yozib bo‘lgandir — shunchaki e'tiborsiz o‘tamiz
        print(f"⚠️ URL oldinroq saqlangan: {url}")
        return False


@sync_to_async
def upload_video_from_url(file_url, file_name):
    response = requests.get(file_url)
    if response.status_code != 200:
        raise Exception("Fayl yuklab olinmadi")

    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    b2_api.authorize_account("production", KEY_ID, APPLICATION_KEY)
    bucket = b2_api.get_bucket_by_name(BUCKET_NAME)

    file_data = BytesIO(response.content)
    bucket.upload_bytes(file_data.read(), file_name)
    print("✅ Bulutga yuklandi:", file_name)

async def fetch_instagram_media(request):
    url = request.GET.get("url")
    if not url:
        return JsonResponse({"error": True, "message": "URL kiritilmagan."}, status=400)

    media = await get_cached_media(url)
    if media and await is_file_in_bucket(media.filename):
        print("bazada bor ekan")

        if media.filename.endswith(".mp4"):
            media_type = "video"
            ext = "mp4"
            quality = "360p"
        elif media.filename.endswith(".jpg") or media.filename.endswith(".png"):
            media_type = "image"
            ext = "jpg"
            quality = None
        else:
            media_type = "unknown"
            ext = ""
            quality = None

        return JsonResponse({
            "thumbnail": None,
            "medias": [
                {
                    "quality": quality,
                    "type": media_type,
                    "download_url": f"https://f003.backblazeb2.com/file/{BUCKET_NAME}/{media.filename}",
                    "ext": ext
                }
            ]
        })
    try:
        # Platformani aniqlash
        if "youtube.com" in url or "youtu.be" in url:
            api_url = "https://fast.videoyukla.uz/youtube/media"
            params = {"yt_url": url}
            is_downloadable = False  # YouTube yuklanmaydi
        elif "instagram.com" in url:
            platform = "instagram"
            params = {"in_url": url}
            api_url = f"https://fast.videoyukla.uz/{platform}/media"
            is_downloadable = True
        elif "tiktok.com" in url:
            platform = "tiktok"
            params = {"tk_url": url}
            api_url = f"https://fast.videoyukla.uz/{platform}/media"
            is_downloadable = True
        elif "facebook.com" in url or "fb.watch" in url:
            platform = "facebook"
            params = {"url": url}
            api_url = f"https://fast.videoyukla.uz/{platform}/media"
            is_downloadable = True
        else:
            return JsonResponse({"error": True, "message": "Platforma qo‘llab-quvvatlanmaydi."}, status=400)

        # So‘rov yuborish
        print("kkkkkkkkkkkkkkkk>>>", api_url)
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.get(api_url, params=params)

        # To‘liq ob'ektlar:
        print("🔗 So‘rov URL:", response.url)
        print("📨 Status Code:", response.status_code)
        print("🧾 Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")

        print("\n📄 Javob matni:")
        print(response.text[:2000])  # Birinchi 2000 ta belgini chiqaramiz

        print("\n📦 JSON parsable bo‘lsa:")
        try:
            print(response.json())  # Agar JSON bo‘lsa, obyektni chiqaradi
        except Exception as e:
            print("❌ JSON emas:", str(e))

        print("Assalomu alaykum yaxshimisiz1111111111111111111111")
        if response.status_code != 200:
            return JsonResponse({"error": True, "message": "API javobi noto‘g‘ri."}, status=500)
        print("Assalomu alaykum yaxshimisiz")
        # Javobni o‘qish
        data = json.loads(response.content)
        medias = data.get("medias", [])
        print(">>>>>>>>>>>>>>>>>>>>", response.json())
        # Agar bu yuklab olinadigan platforma bo‘lsa — navbatga qo‘shamiz
        if is_downloadable:
            # Faqat yuklanadigan media turlarini filtrlash
            downloadable_medias = [
                m for m in medias
                if m.get("type") in ["video", "image"] and m.get("download_url")
            ]
            if len(downloadable_medias) == 1:
                m = downloadable_medias[0]
                media_type = m.get("type")
                download_url = m.get("download_url")
                ext = "mp4" if media_type == "video" else "jpg"
                filename = url.replace("https://", "").replace("/", "_") + f".{ext}"

                pending_uploads.append({
                    "video_url": download_url,
                    "filename": filename,
                    "url": url,
                    "type": media_type
                })

                print(f"✅ Bitta media navbatga qo‘shildi: {media_type} - {filename}")
            else:
                print(f"ℹ️ {len(downloadable_medias)} ta media topildi, saqlanmaydi.")

        # Har doim API dan qaytgan natijani qaytaramiz
        return JsonResponse(data)
    except Exception as e:
        print("❌ Exception:", str(e))
        return JsonResponse({"error": True, "message": str(e)}, status=500)

@csrf_exempt
def download_video(request):
    print("📩 So‘rov keldi:", request.method)

    if request.method != "POST":
        print("❌ Not POST method")
        return JsonResponse({"error": True, "message": "POST so‘rovi kerak."}, status=400)

    try:
        data = json.loads(request.body)
        print("✅ JSON body olindi")
        print("📦 Frontdan kelgan data:\n", json.dumps(data, indent=2, ensure_ascii=False))

        quality = data.get("quality")
        video_data = data.get("videoData")
        print("🎯 Quality:", quality)
        print("🎞️ Video data mavjud:", bool(video_data))

        if not quality or not video_data:
            print("❌ Quality yoki videoData yo‘q")
            return JsonResponse({"error": True, "message": "Video ma’lumotlari yoki sifat kiritilmagan."}, status=400)

        medias = video_data.get("medias", [])
        print(f"🎬 Medias soni: {len(medias)}")

        audio_url = next(
            (m["url"] for m in medias if m.get("type") == "audio" and "medium" in m.get("quality", "").lower()),
            None
        )
        print("🔊 Audio URL:", audio_url)

        def normalize_quality(q):
            if "x" in q:
                try:
                    height = int(q.split("x")[0].strip())
                    return f"{height}p"
                except:
                    return q.strip()
            return q.replace("(", "").replace(")", "").strip().lower()

        normalized_quality = normalize_quality(quality)

        video_url = next(
            (
                m["url"]
                for m in medias
                if m.get("type") == "video" and normalize_quality(m.get("quality", "")) == normalized_quality
            ),
            None
        )

        print("📹 Video URL:", video_url)

        if not video_url:
            print("❌ Video topilmadi")
            return JsonResponse({"error": True, "message": "Video topilmadi."}, status=404)

        if quality == "360p":
            print("✅ 360p video qaytarilmoqda (birlashtirish shart emas)", video_url)
            return JsonResponse({"url": video_url})

        if not audio_url:
            print("❌ Audio topilmadi")
            return JsonResponse({"error": True, "message": "Audio topilmadi."}, status=404)

        ffmpeg = getattr(settings, "FFMPEG_PATH", "ffmpeg")
        command = [
            ffmpeg,
            "-i", video_url,
            "-i", audio_url,
            "-c:v", "copy",
            "-c:a", "aac",
            "-movflags", "frag_keyframe+empty_moov",
            "-f", "mp4",
            "-"
        ]
        print("▶️ FFmpeg command:", ' '.join(command))
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        response = StreamingHttpResponse(process.stdout, content_type='video/mp4')
        response['Content-Disposition'] = 'inline; filename="merged_video.mp4"'
        response['Cache-Control'] = 'no-cache'
        return response

    except Exception as e:
        print("❌ Exception:", str(e))
        return JsonResponse({"error": True, "message": str(e)}, status=500)


async def find_music(request):
    if request.method != "GET":
        return JsonResponse({"error": True, "message": "Faqat GET so‘rovi."}, status=405)
    query = request.GET.get("query", "").strip()
    if not query:
        return JsonResponse({"error": True, "message": "Query bo‘sh."}, status=400)

    try:
        api_url = f"https://fast.videoyukla.uz/youtube/music/search/?query={query}&limit=40"
        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, timeout=20)

        if response.status_code != 200:
            return JsonResponse({"error": True, "message": "API javobi noto‘g‘ri."}, status=500)

        data = response.json()
        return JsonResponse({"error": False, "results": data})

    except Exception as e:
        return JsonResponse({"error": True, "message": str(e)}, status=500)


@csrf_exempt
async def shazam_search(request):
    if request.method != "POST":
        return JsonResponse({"error": True, "message": "Faqat POST ruxsat etiladi."}, status=405)

    try:
        body = await request.body
        data = json.loads(body)

        # Parametrlardan birortasi mavjud bo‘lishi kerak
        if not any(k in data for k in ["query", "mp3", "mp4"]):
            return JsonResponse({"error": True, "message": "Hech qanday parametr yuborilmadi."}, status=400)

        form_data = {}
        for key in ["query", "mp3", "mp4"]:
            if key in data:
                form_data[key] = data[key]

        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://fast.videoyukla.uz/shazam/search/",
                data=form_data,
                timeout=10
            )

        if res.status_code != 200:
            return JsonResponse({"error": True, "message": "Ulanishda xatolik."}, status=500)

        response_data = res.json()
        return JsonResponse({
            "error": False,
            "result": response_data
        })
    except Exception as e:
        return JsonResponse({"error": True, "message": str(e)}, status=500)


def download_music(request):
    page_url = request.GET.get("url")
    if not page_url:
        return HttpResponse("URL topilmadi", status=400)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/90 Safari/537.36"
    }

    try:
        page_resp = requests.get(page_url, headers=headers)
        if page_resp.status_code != 200:
            return HttpResponse("Sahifa yuklanmadi", status=404)

        # MP3 linkni topamiz
        match = re.search(r'https://cdn\.videoyukla\.uz/files/[^\s"]+\.mp3', page_resp.text)
        if not match:
            return HttpResponse("MP3 link topilmadi", status=404)

        mp3_url = match.group(0)

        # MP3 faylni yuklab olamiz
        mp3_resp = requests.get(mp3_url, stream=True)
        if mp3_resp.status_code != 200:
            return HttpResponse("MP3 fayl yuklanmadi", status=404)

        file_stream = BytesIO(mp3_resp.content)

        # Chrome yuklab olishni avtomatik boshlashi uchun content-disposition header
        response = FileResponse(file_stream, content_type="audio/mpeg")
        response["Content-Disposition"] = 'attachment; filename="music.mp3"'
        return response

    except Exception as e:
        return HttpResponse(f"Xatolik: {str(e)}", status=500)

