from django.shortcuts import render

def index(request):
    return render(request, 'valyuta_converter/index.html')
