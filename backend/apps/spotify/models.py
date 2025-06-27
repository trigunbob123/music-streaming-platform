from django.db import models
from django.contrib.auth.models import User

class SpotifyUser(models.Model):
    """存儲用戶的 Spotify 信息"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    spotify_user_id = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    country = models.CharField(max_length=10, blank=True)
    spotify_url = models.URLField(blank=True)
    followers = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} ({self.spotify_user_id})"

class UserPlaylist(models.Model):
    """用戶的 Spotify 播放清單"""
    spotify_user = models.ForeignKey(SpotifyUser, on_delete=models.CASCADE)
    spotify_playlist_id = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    public = models.BooleanField(default=False)
    collaborative = models.BooleanField(default=False)
    tracks_total = models.IntegerField(default=0)
    image_url = models.URLField(blank=True)
    spotify_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['spotify_user', 'spotify_playlist_id']

    def __str__(self):
        return f"{self.name} - {self.spotify_user.display_name}"