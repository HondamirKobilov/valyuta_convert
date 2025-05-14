# your_app/uploads/worker.py
import asyncio
from kontent_download.uploads.queue import pending_uploads
from kontent_download.views import upload_video_from_url, save_media_to_db


async def process_pending_uploads():
    while True:
        if pending_uploads:
            task = pending_uploads.popleft()
            try:
                # 1. Avval bazaga yozib ko‘ramiz
                created = await save_media_to_db(url=task["url"], filename=task["filename"])

                # 2. Faqat yangi bo‘lsa, bulutga yuklaymiz
                if created:
                    await upload_video_from_url(task["video_url"], task["filename"])
                    print("✅ Yangi video yuklandi:", task["filename"])
                else:
                    print("⚠️ Bazada bor edi, bulutga qayta yuklanmadi:", task["filename"])

            except Exception as e:
                print("❌ Xatolik:", str(e))
        await asyncio.sleep(1)
