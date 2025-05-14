import json
import subprocess
import httpx
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import render
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from kontent_download.models import DownloadedMedia

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

async def fetch_instagram_media(request):
    url = request.GET.get("url")
    if not url:
        return JsonResponse({"error": True, "message": "URL kiritilmagan."}, status=400)
    try:
        # YouTube uchun alohida ishlov
        if "youtube.com" in url or "youtu.be" in url:
            api_url = "https://fast.videoyukla.uz/youtube/media"
            params = {"yt_url": url}
        else:
            # Qolgan platformalarni aniqlash
            if "instagram.com" in url:
                platform = "instagram"
                params = {"in_url": url}
            elif "tiktok.com" in url:
                platform = "tiktok"
                params = {"tk_url": url}
            elif "facebook.com" in url or "fb.watch" in url:
                platform = "facebook"
                params = {"url": url}
            else:
                return JsonResponse({"error": True, "message": "Platforma qo‘llab-quvvatlanmaydi."}, status=400)

            api_url = f"https://fast.videoyukla.uz/{platform}/media"

        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.get(api_url, params=params)

        if response.status_code != 200:
            return JsonResponse({"error": True, "message": "API javobi noto‘g‘ri."}, status=500)

        return JsonResponse(response.json())

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
            print("✅ 360p video qaytarilmoqda (birlashtirish shart emas)")
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