from django.db import models
from django.utils.timezone import now


# User modeli
class User(models.Model):
    id = models.BigAutoField(primary_key=True)
    user_id = models.BigIntegerField(unique=True)
    fullname = models.CharField(max_length=255, blank=True, null=True)
    username = models.CharField(max_length=255, blank=True, null=True)
    is_blocked = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username or self.fullname or str(self.user_id)

    class Meta:
        db_table = "oliygoh_user"


# Result modeli
class Result(models.Model):
    id = models.BigAutoField(primary_key=True)
    year = models.IntegerField()
    direction_id = models.CharField(max_length=255)
    region_name = models.CharField(max_length=255, default="Noma'lum")
    institute_name = models.CharField(max_length=255, default="Noma'lum")
    direction_name = models.CharField(max_length=255, default="Noma'lum")
    grand_kvota = models.IntegerField(default=0)
    kontrakt_kvota = models.IntegerField(default=0)
    grand_ball = models.FloatField(default=0)
    kontrakt_ball = models.FloatField(default=0)
    language = models.CharField(max_length=255, default="O'zbek")
    olimp = models.IntegerField(default=0)
    etype = models.CharField(max_length=255, default="Kunduzgi")

    def __str__(self):
        return f"{self.direction_name} ({self.year})"

    class Meta:
        db_table = "result"  # PostgreSQL dagi jadval nomi


# Subjects modeli
class Subjects(models.Model):
    id = models.BigAutoField(primary_key=True)
    fid = models.CharField(max_length=255, blank=True, null=True)
    year = models.IntegerField()
    fanlar = models.CharField(max_length=255)
    dir_name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.dir_name} ({self.year})"

    class Meta:
        db_table = "subjects"  # PostgreSQL dagi jadval nomi
