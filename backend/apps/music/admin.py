from django.contrib import admin
from .models import Artist, Album, Song

@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ['name', 'spotify_id']
    search_fields = ['name']

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'release_date']
    list_filter = ['release_date', 'artist']
    search_fields = ['title', 'artist__name']

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'album', 'genre', 'duration']
    list_filter = ['genre', 'created_at', 'artist']
    search_fields = ['title', 'artist__name', 'album__title']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('artist', 'album')
