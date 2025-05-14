from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('valyuta_converter.urls')),
    path('shazam/', include('shazam.urls')),
    path('kontent_download/', include('kontent_download.urls')),
]

# Media fayllarga xizmat qilish
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

