from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Result',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('year', models.IntegerField()),
                ('direction_id', models.CharField(max_length=255)),
                ('region_name', models.CharField(default="Noma'lum", max_length=255)),
                ('institute_name', models.CharField(default="Noma'lum", max_length=255)),
                ('direction_name', models.CharField(default="Noma'lum", max_length=255)),
                ('grand_kvota', models.IntegerField(default=0)),
                ('kontrakt_kvota', models.IntegerField(default=0)),
                ('grand_ball', models.FloatField(default=0)),
                ('kontrakt_ball', models.FloatField(default=0)),
                ('language', models.CharField(default="O'zbek", max_length=255)),
                ('olimp', models.IntegerField(default=0)),
                ('etype', models.CharField(default='Kunduzgi', max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='Subjects',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('fid', models.CharField(blank=True, max_length=255, null=True)),
                ('year', models.IntegerField()),
                ('fanlar', models.CharField(max_length=255)),
                ('dir_name', models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('user_id', models.BigIntegerField(unique=True)),
                ('fullname', models.CharField(blank=True, max_length=255, null=True)),
                ('username', models.CharField(blank=True, max_length=255, null=True)),
                ('is_blocked', models.BooleanField(default=False)),
                ('is_premium', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
