from django.http import HttpResponse

def home(request):
    return HttpResponse("✅ exchanger.uz ishlayapti!")
