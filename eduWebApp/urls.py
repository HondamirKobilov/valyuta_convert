from django.contrib import admin
from django.urls import path
from django.http import HttpResponse

def home(request):
    return HttpResponse("✅ exchanger.uz saytimiz ishlayapti!")

urlpatterns = [
    path('', home),  # asosiy sahifa
    path('admin/', admin.site.urls),
]
