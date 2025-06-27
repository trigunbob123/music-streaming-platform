from rest_framework import serializers
from .models import Song, Artist, Album

class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = '__all__'

class AlbumSerializer(serializers.ModelSerializer):
    artist = ArtistSerializer(read_only=True)
    
    class Meta:
        model = Album
        fields = '__all__'
    
    def to_representation(self, instance):
        """自定義序列化輸出"""
        data = super().to_representation(instance)
        
        # 確保封面圖片URL正確
        if data.get('cover_image'):
            if not data['cover_image'].startswith(('http://', 'https://')):
                # 如果是相對路徑，添加完整URL
                request = self.context.get('request')
                if request:
                    data['cover_image'] = request.build_absolute_uri(data['cover_image'])
        
        return data

class SongSerializer(serializers.ModelSerializer):
    artist = ArtistSerializer(read_only=True)
    album = AlbumSerializer(read_only=True)
    
    class Meta:
        model = Song
        fields = '__all__'
    
    def to_representation(self, instance):
        """自定義序列化輸出"""
        data = super().to_representation(instance)
        
        # 確保音頻文件URL正確
        if data.get('audio_file'):
            if not data['audio_file'].startswith(('http://', 'https://')):
                request = self.context.get('request')
                if request:
                    data['audio_file'] = request.build_absolute_uri(data['audio_file'])
        
        # 添加額外的調試信息（開發環境）
        if hasattr(instance, 'id'):
            data['debug_info'] = {
                'has_audio': bool(instance.audio_file),
                'has_cover': bool(instance.album.cover_image if instance.album else None),
                'audio_url_type': 'external' if str(instance.audio_file).startswith('http') else 'local'
            }
        
        return data