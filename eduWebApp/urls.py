from django.contrib import admin
from django.urls import path, include  # include qo‘shildi

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('oliygoh.urls')),  # 👉 asosiy sahifani app ga yo‘naltiramiz
]
