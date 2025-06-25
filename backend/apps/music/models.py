from django.db import models

class Artist(models.Model):
    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='artists/', blank=True)
    spotify_id = models.CharField(max_length=100, unique=True, null=True)
    
class Album(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    cover_image = models.ImageField(upload_to='albums/', blank=True)
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
    audio_file = models.FileField(upload_to='music/', blank=True)
    hls_url = models.URLField(blank=True)
    spotify_id = models.CharField(max_length=100, unique=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
