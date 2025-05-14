# urls.py fayli (kontent_download app)
from django.urls import path
from . import views
from .views import find_music, shazam_search, download_music

app_name = "kontent_download"

urlpatterns = [
    path('', views.index, name='index'),
    path('api/fetch_instagram_media/', views.fetch_instagram_media, name='fetch_instagram_media'),
    path('api/download_video/', views.download_video, name='download_video'),
    path('api/find_music/', find_music, name='find_music'),
    path('api/shazam/', shazam_search, name='shazam_search'),
    path("download_music/", download_music, name="download_music"),
]
