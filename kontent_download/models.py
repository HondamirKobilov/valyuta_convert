from django.db import models

class DownloadedMedia(models.Model):
    url = models.URLField(unique=True)
    filename = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.url