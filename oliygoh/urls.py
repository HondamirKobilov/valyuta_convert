from django.urls import path
from .views import home  # views.py ichidagi home funksiyasini chaqiramiz

urlpatterns = [
    path('', home, name='home'),
]
