from django.apps import AppConfig
import asyncio
import threading

class OliygohConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'kontent_download'

    def ready(self):
        def run_worker():
            import asyncio
            from kontent_download.uploads.worker import process_pending_uploads  # 👈 faqat shu yerda import qilinadi

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(process_pending_uploads())

        threading.Thread(target=run_worker, daemon=True).start()
        print("✅ process_pending_uploads ishga tushdi (thread ichida)")
