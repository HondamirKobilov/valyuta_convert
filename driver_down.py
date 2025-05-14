from b2sdk.v1 import InMemoryAccountInfo, B2Api

# Kirish uchun ma'lumotlar
key_id = "a30c6bd1bcc5"
application_key = "003bfeaf835a36e9e5b65c3f13f1607c4ca18ced0b"
bucket_name = "server777"  # <-- BUCKET NOMINI HAQIQIY ISMIGA ALMASHTIRING
local_file_path = "vid.mp4"  # Yuklamoqchi bo'lgan faylingiz
remote_file_name = "video.mp4"  # B2'da qanday nomda saqlansin

# Kirish
info = InMemoryAccountInfo()
b2_api = B2Api(info)
b2_api.authorize_account("production", key_id, application_key)

# Bucketni olish
bucket = b2_api.get_bucket_by_name(bucket_name)

# Faylni yuklash
uploaded_file = bucket.upload_local_file(
    local_file=local_file_path,
    file_name=remote_file_name
)

# Public link
public_url = f"https://f000.backblazeb2.com/file/{bucket_name}/{remote_file_name}"
print("✅ Yuklandi! Video URL:", public_url)



# Saytdagi joyga yuklash jarayoni
# from b2sdk.v1 import InMemoryAccountInfo, B2Api, DownloadDestLocalFile
# # Kirish ma'lumotlari
# key_id = "a30c6bd1bcc5"
# application_key = "003bfeaf835a36e9e5b65c3f13f1607c4ca18ced0b"
# bucket_name = "server777"
# file_name = "video.mp4"  # B2 ichidagi fayl
# local_file_path = "downloaded_video.mp4"  # Kompyuteringizga saqlanadigan nom
#
# # Autentifikatsiya
# info = InMemoryAccountInfo()
# b2_api = B2Api(info)
# b2_api.authorize_account("production", key_id, application_key)
#
# # Bucketni olish
# bucket = b2_api.get_bucket_by_name(bucket_name)
#
# # Faylni yuklab olish
# bucket.download_file_by_name(
#     file_name,
#     DownloadDestLocalFile(local_file_path)
# )
# print("✅ Fayl muvaffaqiyatli yuklab olindi:", local_file_path)

