from django.db import models

class User(models.Model):
    telegram_id = models.BigIntegerField(unique=True)
    username = models.CharField(max_length=255, null=True, blank=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username or str(self.telegram_id)


class Content(models.Model):
    source_link = models.TextField(null=True, blank=True, unique=True)
    content_type = models.CharField(max_length=20)  # video, audio, voice, etc.
    platform = models.CharField(max_length=50)  # instagram, tiktok, etc.
    telegram_file_id = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, null=True, blank=True)
    file_unique_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.platform} - {self.content_type}"


class Download(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='downloads')
    content = models.ForeignKey(Content, on_delete=models.SET_NULL, null=True, blank=True)
    original_link = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, default='success')
    response_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.telegram_id} - {self.original_link or self.content}"
