from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from .models import Song, Artist, Album
from .serializers import SongSerializer, ArtistSerializer
import random

class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.all().select_related('artist', 'album')
    serializer_class = SongSerializer
    
    def get_queryset(self):
        """優化查詢性能"""
        return Song.objects.all().select_related('artist', 'album').order_by('id')
    
    @action(detail=False, methods=['get'])
    def by_genre(self, request):
        """按曲風獲取歌曲"""
        genre = request.query_params.get('genre')
        if not genre:
            return Response(
                {'error': 'Genre parameter required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            songs = self.get_queryset().filter(genre=genre)
            serializer = self.get_serializer(songs, many=True)
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'genre': genre
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch songs: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def random(self, request):
        """獲取隨機歌曲"""
        try:
            count = int(request.query_params.get('count', 10))
            count = min(count, 50)  # 限制最大數量
            
            # 使用 Django 的隨機排序
            songs = self.get_queryset().order_by('?')[:count]
            serializer = self.get_serializer(songs, many=True)
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'requested_count': count
            })
        except ValueError:
            return Response(
                {'error': 'Invalid count parameter'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch random songs: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """獲取最新歌曲"""
        try:
            count = int(request.query_params.get('count', 10))
            count = min(count, 50)  # 限制最大數量
            
            songs = self.get_queryset().order_by('-created_at')[:count]
            serializer = self.get_serializer(songs, many=True)
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'requested_count': count
            })
        except ValueError:
            return Response(
                {'error': 'Invalid count parameter'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch latest songs: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def health(self, request):
        """健康檢查端點"""
        try:
            song_count = Song.objects.count()
            artist_count = Artist.objects.count()
            album_count = Album.objects.count()
            
            return Response({
                'status': 'healthy',
                'database': 'connected',
                'counts': {
                    'songs': song_count,
                    'artists': artist_count,
                    'albums': album_count
                }
            })
        except Exception as e:
            return Response(
                {'status': 'error', 'message': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )