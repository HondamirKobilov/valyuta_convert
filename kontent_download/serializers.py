from rest_framework import serializers
from .models import DownloadedMedia

class DownloadedMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DownloadedMedia
        fields = '__all__'
