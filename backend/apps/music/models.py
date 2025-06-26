# 更新 backend/apps/music/models.py

from django.db import models

class Artist(models.Model):
    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='artists/', blank=True)
    spotify_id = models.CharField(max_length=100, unique=True, null=True)
    
class Album(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    # 🔧 修改：使用 URLField 而不是 ImageField
    cover_image = models.URLField(blank=True, null=True)  # 改為 URLField
    release_date = models.DateField()
    spotify_id = models.CharField(max_length=100, unique=True, null=True)

class Song(models.Model):
    GENRE_CHOICES = [
        ('Pop', 'Pop'),
        ('Rock', 'Rock'),
        ('Hip-Hop', 'Hip-Hop'),
        ('Electronic', 'Electronic'),
        ('Jazz', 'Jazz'),
        ('Classical', 'Classical'),
        ('Country', 'Country'),
        ('Latin', 'Latin'),
        ('R&B', 'R&B'),
        ('Folk', 'Folk'),
    ]
    
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, on_delete=models.CASCADE)
    genre = models.CharField(max_length=50, choices=GENRE_CHOICES)
    duration = models.IntegerField()  # 秒數
    # 🔧 修改：使用 URLField 而不是 FileField
    audio_file = models.URLField(blank=True, null=True)  # 改為 URLField
    hls_url = models.URLField(blank=True)
    spotify_id = models.CharField(max_length=100, unique=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)