import os
import json
import subprocess
import httpx
import requests
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import render
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from b2sdk.v1 import InMemoryAccountInfo, B2Api
from kontent_download.models import DownloadedMedia
from b2sdk.v1 import InMemoryAccountInfo, B2Api, UploadSourceBytes

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

def normalize_quality(q):
    if "x" in q:
        try:
            height = int(q.split("x")[0].strip())
            return f"{height}p"
        except:
            return q.strip()
    return q.replace("(", "").replace(")", "").strip().lower()


def fetch_instagram_media(request):
    url = request.GET.get("url")
    print("📥 URL:", url)

    if not url:
        return JsonResponse({"error": True, "message": "URL yo‘q."}, status=400)

    # 1. Baza tekshirish
    media = DownloadedMedia.objects.filter(url=url).first()
    if media:
        print("✅ Bazada bor:", media.filename)
        return JsonResponse({
            "thumbnail": None,
            "medias": [
                {
                    "quality": "360p",
                    "type": "video",
                    "download_url": f"https://f004.backblazeb2.com/file/{BUCKET_NAME}/{media.filename}",
                    "ext": "mp4"
                }
            ]
        })

    # 2. Platforma aniqlash
    if "instagram.com" in url:
        api_url = "https://fast.videoyukla.uz/instagram/media"
        params = {"in_url": url}
    else:
        return JsonResponse({"error": True, "message": "Platforma qo‘llab-quvvatlanmaydi."}, status=400)

    try:
        response = requests.get(api_url, params=params, timeout=30)
        if response.status_code != 200:
            return JsonResponse({"error": True, "message": "API javobi noto‘g‘ri."}, status=500)

        data = response.json()
        medias = data.get("medias", [])
        video_url = next((m.get("download_url") for m in medias if m.get("type") == "video"), None)
        print("📦 Medias:", medias)
        if not video_url:
            return JsonResponse({"error": True, "message": "Video topilmadi."}, status=404)

        # Yuklab olish, bulutga yuklash, bazaga yozish (avvalgi kodga asosan)...
        filename = url.replace("https://", "").replace("/", "_") + ".mp4"
        r = requests.get(video_url)
        bucket = get_b2_bucket()
        bucket.upload_bytes(r.content, filename)
        DownloadedMedia.objects.create(url=url, filename=filename)

        return JsonResponse({
            "thumbnail": data.get("thumbnail"),
            "medias": [
                {
                    "quality": "360p",
                    "type": "video",
                    "download_url": f"https://f004.backblazeb2.com/file/{BUCKET_NAME}/{filename}",
                    "ext": "mp4"
                }
            ]
        })

    except Exception as e:
        return JsonResponse({"error": True, "message": f"Xatolik: {str(e)}"}, status=500)


@csrf_exempt
def download_video(request):
    if request.method != "POST":
        return JsonResponse({"error": True, "message": "POST so‘rovi kerak."}, status=400)

    try:
        data = json.loads(request.body)
        url = data.get("url")
        video_data = data.get("videoData")
        quality = data.get("quality")

        if not url or not video_data or not quality:
            return JsonResponse({"error": True, "message": "Ma'lumotlar to‘liq emas."}, status=400)

        if DownloadedMedia.objects.filter(url=url).exists():
            found = DownloadedMedia.objects.get(url=url)
            return JsonResponse({"url": f"https://f004.backblazeb2.com/file/{BUCKET_NAME}/{found.filename}"})

        medias = video_data.get("medias", [])
        normalized = normalize_quality(quality)

        video_url = next((m.get("url") or m.get("download_url") for m in medias if m.get("type") == "video" and normalize_quality(m.get("quality", "")) == normalized), None)
        audio_url = next((m.get("url") for m in medias if m.get("type") == "audio"), None)

        if not video_url:
            return JsonResponse({"error": True, "message": "Video topilmadi."}, status=404)
        if quality != "360p" and not audio_url:
            return JsonResponse({"error": True, "message": "Audio topilmadi."}, status=404)

        filename = url.replace("https://", "").replace("/", "_") + ".mp4"

        if quality == "360p":
            video_content = requests.get(video_url).content
        else:
            command = [
                "ffmpeg",
                "-i", video_url,
                "-i", audio_url,
                "-c:v", "copy",
                "-c:a", "aac",
                "-movflags", "frag_keyframe+empty_moov",
                "-f", "mp4",
                "-"
            ]
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            video_content, err = process.communicate()
            if process.returncode != 0:
                return JsonResponse({"error": True, "message": "FFmpeg xatoligi."})

        bucket = get_b2_bucket()
        bucket.upload_bytes(UploadSourceBytes(video_content), filename)

        DownloadedMedia.objects.create(url=url, filename=filename)

        return JsonResponse({"url": f"https://f004.backblazeb2.com/file/{BUCKET_NAME}/{filename}"})

    except Exception as e:
        return JsonResponse({"error": True, "message": str(e)}, status=500)
