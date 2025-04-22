from django.contrib import admin
from django.urls import path
from .views import index  # import qildik

urlpatterns = [
    path('', index()),
    path('admin/', admin.site.urls),
]
