from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Song, Artist, Album
from .serializers import SongSerializer, ArtistSerializer

class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    
    @action(detail=False, methods=['get'])
    def by_genre(self, request):
        genre = request.query_params.get('genre')
        if genre:
            songs = self.queryset.filter(genre=genre)
            serializer = self.get_serializer(songs, many=True)
            return Response(serializer.data)
        return Response({'error': 'Genre parameter required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def random(self, request):
        count = int(request.query_params.get('count', 10))
        songs = self.queryset.order_by('?')[:count]
        serializer = self.get_serializer(songs, many=True)
        return Response(serializer.data)
