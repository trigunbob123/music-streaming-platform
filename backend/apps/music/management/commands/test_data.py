from django.core.management.base import BaseCommand
from apps.music.models import Artist, Album, Song
from datetime import date

class Command(BaseCommand):
    help = '創建測試音樂數據'

    def handle(self, *args, **options):
        # 創建測試藝人
        artist, created = Artist.objects.get_or_create(
            name='Test Artist',
            defaults={
                'spotify_id': 'test_artist_123',
                'image': ''
            }
        )
        
        # 創建測試專輯
        album, created = Album.objects.get_or_create(
            title='Test Album',
            artist=artist,
            defaults={
                'cover_image': 'https://via.placeholder.com/300x300/ec4899/fff?text=Test',
                'release_date': date.today(),
                'spotify_id': 'test_album_123'
            }
        )
        
        # 創建測試歌曲
        genres = ['Pop', 'Rock', 'Jazz', 'Classical', 'Electronic']
        
        for i, genre in enumerate(genres):
            song, created = Song.objects.get_or_create(
                title=f'Test Song {i+1} - {genre}',
                artist=artist,
                album=album,
                defaults={
                    'genre': genre,
                    'duration': 180 + (i * 30),  # 3-6分鐘
                    'audio_file': 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
                    'spotify_id': f'test_song_{i+1}_123'
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'成功創建歌曲: {song.title}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'歌曲已存在: {song.title}')
                )