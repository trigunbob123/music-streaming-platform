# backend/apps/jamendo/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

class JamendoTrack(models.Model):
    """本地緩存的 Jamendo 音軌信息"""
    
    # 基本信息
    jamendo_id = models.IntegerField(unique=True, verbose_name="Jamendo ID")
    name = models.CharField(max_length=500, verbose_name="歌曲名稱")
    artist_name = models.CharField(max_length=200, verbose_name="藝人名稱")
    artist_id = models.IntegerField(verbose_name="藝人 ID")
    album_name = models.CharField(max_length=200, blank=True, verbose_name="專輯名稱")
    album_id = models.IntegerField(null=True, blank=True, verbose_name="專輯 ID")
    duration = models.IntegerField(verbose_name="時長(秒)")  # 秒數
    position = models.IntegerField(default=1, verbose_name="專輯中的位置")
    releasedate = models.DateField(null=True, blank=True, verbose_name="發行日期")
    
    # 音頻 URLs
    audio = models.URLField(verbose_name="音頻串流 URL")
    audiodownload = models.URLField(verbose_name="音頻下載 URL")
    
    # 圖片 URLs
    image = models.URLField(blank=True, verbose_name="歌曲封面")
    album_image = models.URLField(blank=True, verbose_name="專輯封面")
    
    # 標籤和分類 (JSON 格式存儲)
    musicinfo_tags_genres = models.TextField(
        blank=True, 
        verbose_name="曲風標籤",
        help_text="JSON 格式存儲的曲風標籤列表"
    )
    musicinfo_tags_instruments = models.TextField(
        blank=True, 
        verbose_name="樂器標籤",
        help_text="JSON 格式存儲的樂器標籤列表"
    )
    musicinfo_tags_vartags = models.TextField(
        blank=True, 
        verbose_name="其他標籤",
        help_text="JSON 格式存儲的其他標籤列表"
    )
    
    # 統計信息
    stats_rate = models.FloatField(default=0.0, verbose_name="評分")
    stats_downloads_total = models.IntegerField(default=0, verbose_name="下載次數")
    stats_playlisted = models.IntegerField(default=0, verbose_name="收藏次數")
    
    # 本地字段
    cached_at = models.DateTimeField(auto_now=True, verbose_name="緩存時間")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="創建時間")
    
    class Meta:
        db_table = 'jamendo_tracks'
        ordering = ['-stats_rate', '-stats_downloads_total']
        verbose_name = "Jamendo 音軌"
        verbose_name_plural = "Jamendo 音軌"
        indexes = [
            models.Index(fields=['jamendo_id']),
            models.Index(fields=['artist_name']),
            models.Index(fields=['album_name']),
            models.Index(fields=['stats_rate']),
            models.Index(fields=['cached_at']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.artist_name}"
    
    @property
    def duration_formatted(self):
        """格式化時長顯示"""
        if self.duration:
            minutes = self.duration // 60
            seconds = self.duration % 60
            return f"{minutes:02d}:{seconds:02d}"
        return "00:00"
    
    @property
    def genres_list(self):
        """獲取曲風列表"""
        try:
            return json.loads(self.musicinfo_tags_genres) if self.musicinfo_tags_genres else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    @property
    def instruments_list(self):
        """獲取樂器列表"""
        try:
            return json.loads(self.musicinfo_tags_instruments) if self.musicinfo_tags_instruments else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    @property
    def vartags_list(self):
        """獲取其他標籤列表"""
        try:
            return json.loads(self.musicinfo_tags_vartags) if self.musicinfo_tags_vartags else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    @property
    def all_tags(self):
        """獲取所有標籤的組合列表"""
        all_tags = []
        all_tags.extend(self.genres_list)
        all_tags.extend(self.instruments_list)
        all_tags.extend(self.vartags_list)
        return list(set(all_tags))  # 去重
    
    def set_genres(self, genres_list):
        """設置曲風標籤"""
        self.musicinfo_tags_genres = json.dumps(genres_list) if genres_list else ''
    
    def set_instruments(self, instruments_list):
        """設置樂器標籤"""
        self.musicinfo_tags_instruments = json.dumps(instruments_list) if instruments_list else ''
    
    def set_vartags(self, vartags_list):
        """設置其他標籤"""
        self.musicinfo_tags_vartags = json.dumps(vartags_list) if vartags_list else ''
    
    @classmethod
    def create_from_jamendo_data(cls, jamendo_data):
        """從 Jamendo API 數據創建對象"""
        try:
            # 處理音樂信息標籤
            musicinfo = jamendo_data.get('musicinfo', {})
            tags = musicinfo.get('tags', {})
            
            track = cls(
                jamendo_id=jamendo_data['id'],
                name=jamendo_data['name'],
                artist_name=jamendo_data['artist_name'],
                artist_id=jamendo_data['artist_id'],
                album_name=jamendo_data.get('album_name', ''),
                album_id=jamendo_data.get('album_id'),
                duration=jamendo_data['duration'],
                position=jamendo_data.get('position', 1),
                audio=jamendo_data['audio'],
                audiodownload=jamendo_data['audiodownload'],
                image=jamendo_data.get('image', ''),
                album_image=jamendo_data.get('album_image', ''),
                stats_rate=jamendo_data.get('stats', {}).get('rate', 0.0),
                stats_downloads_total=jamendo_data.get('stats', {}).get('downloads_total', 0),
                stats_playlisted=jamendo_data.get('stats', {}).get('playlisted', 0)
            )
            
            # 設置標籤
            track.set_genres(tags.get('genres', []))
            track.set_instruments(tags.get('instruments', []))
            track.set_vartags(tags.get('vartags', []))
            
            # 處理發行日期
            if jamendo_data.get('releasedate'):
                try:
                    from datetime import datetime
                    track.releasedate = datetime.strptime(jamendo_data['releasedate'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    pass
            
            return track
        except KeyError as e:
            raise ValueError(f"缺少必要的 Jamendo 數據字段: {e}")

class UserFavoriteTrack(models.Model):
    """用戶收藏的音軌"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        verbose_name="用戶",
        related_name="favorite_tracks"
    )
    track = models.ForeignKey(
        JamendoTrack, 
        on_delete=models.CASCADE, 
        verbose_name="音軌",
        related_name="favorited_by"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="收藏時間")
    
    class Meta:
        unique_together = ['user', 'track']
        db_table = 'user_favorite_tracks'
        verbose_name = "用戶收藏"
        verbose_name_plural = "用戶收藏"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['track']),
        ]
    
    def __str__(self):
        return f"{self.user.username} 收藏了 {self.track.name}"

class UserPlayHistory(models.Model):
    """用戶播放歷史"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name="用戶",
        related_name="play_history"
    )
    track = models.ForeignKey(
        JamendoTrack, 
        on_delete=models.CASCADE, 
        verbose_name="音軌",
        related_name="play_history"
    )
    session_id = models.CharField(
        max_length=100, 
        blank=True, 
        verbose_name="會話 ID",
        help_text="用於匿名用戶追蹤"
    )
    played_at = models.DateTimeField(auto_now_add=True, verbose_name="播放時間")
    duration_played = models.IntegerField(default=0, verbose_name="播放時長(秒)")
    completed = models.BooleanField(default=False, verbose_name="是否播放完整")
    
    # 播放環境信息
    user_agent = models.TextField(blank=True, verbose_name="用戶代理")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP 地址")
    
    class Meta:
        db_table = 'user_play_history'
        ordering = ['-played_at']
        verbose_name = "播放歷史"
        verbose_name_plural = "播放歷史"
        indexes = [
            models.Index(fields=['user', 'played_at']),
            models.Index(fields=['session_id', 'played_at']),
            models.Index(fields=['track', 'played_at']),
            models.Index(fields=['played_at']),
        ]
    
    def __str__(self):
        user_display = self.user.username if self.user else f"匿名用戶({self.session_id[:8]})"
        return f"{user_display} 播放了 {self.track.name}"
    
    @property
    def completion_rate(self):
        """計算播放完成率"""
        if self.track.duration and self.duration_played:
            return (self.duration_played / self.track.duration) * 100
        return 0
    
    @property
    def duration_played_formatted(self):
        """格式化播放時長"""
        if self.duration_played:
            minutes = self.duration_played // 60
            seconds = self.duration_played % 60
            return f"{minutes:02d}:{seconds:02d}"
        return "00:00"
    
    def mark_as_completed(self):
        """標記為播放完成"""
        self.completed = True
        self.duration_played = self.track.duration
        self.save(update_fields=['completed', 'duration_played'])

class UserPlaylist(models.Model):
    """用戶自定義播放列表"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        verbose_name="用戶",
        related_name="playlists"
    )
    name = models.CharField(max_length=200, verbose_name="播放列表名稱")
    description = models.TextField(blank=True, verbose_name="描述")
    is_public = models.BooleanField(default=False, verbose_name="是否公開")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="創建時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    
    class Meta:
        db_table = 'user_playlists'
        ordering = ['-updated_at']
        verbose_name = "用戶播放列表"
        verbose_name_plural = "用戶播放列表"
        unique_together = ['user', 'name']
        indexes = [
            models.Index(fields=['user', 'updated_at']),
            models.Index(fields=['is_public', 'updated_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} 的播放列表: {self.name}"
    
    @property
    def tracks_count(self):
        """獲取播放列表中的歌曲數量"""
        return self.playlist_tracks.count()

class UserPlaylistTrack(models.Model):
    """播放列表中的音軌"""
    playlist = models.ForeignKey(
        UserPlaylist, 
        on_delete=models.CASCADE, 
        verbose_name="播放列表",
        related_name="playlist_tracks"
    )
    track = models.ForeignKey(
        JamendoTrack, 
        on_delete=models.CASCADE, 
        verbose_name="音軌"
    )
    position = models.PositiveIntegerField(verbose_name="位置")
    added_at = models.DateTimeField(auto_now_add=True, verbose_name="添加時間")
    
    class Meta:
        db_table = 'user_playlist_tracks'
        ordering = ['position']
        verbose_name = "播放列表音軌"
        verbose_name_plural = "播放列表音軌"
        unique_together = ['playlist', 'track']
        indexes = [
            models.Index(fields=['playlist', 'position']),
        ]
    
    def __str__(self):
        return f"{self.playlist.name} - {self.track.name} (位置 {self.position})"

class JamendoAPICache(models.Model):
    """Jamendo API 響應緩存"""
    cache_key = models.CharField(max_length=255, unique=True, verbose_name="緩存鍵")
    response_data = models.JSONField(verbose_name="響應數據")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="創建時間")
    expires_at = models.DateTimeField(verbose_name="過期時間")
    
    class Meta:
        db_table = 'jamendo_api_cache'
        ordering = ['-created_at']
        verbose_name = "API 緩存"
        verbose_name_plural = "API 緩存"
        indexes = [
            models.Index(fields=['cache_key']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"緩存: {self.cache_key}"
    
    @property
    def is_expired(self):
        """檢查緩存是否過期"""
        return timezone.now() > self.expires_at
    
    @classmethod
    def get_cached_response(cls, cache_key):
        """獲取有效的緩存響應"""
        try:
            cache_obj = cls.objects.get(cache_key=cache_key)
            if not cache_obj.is_expired:
                return cache_obj.response_data
            else:
                cache_obj.delete()  # 刪除過期緩存
                return None
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def set_cached_response(cls, cache_key, response_data, expires_in_seconds=3600):
        """設置緩存響應"""
        expires_at = timezone.now() + timezone.timedelta(seconds=expires_in_seconds)
        cache_obj, created = cls.objects.update_or_create(
            cache_key=cache_key,
            defaults={
                'response_data': response_data,
                'expires_at': expires_at
            }
        )
        return cache_obj

class UserListeningStats(models.Model):
    """用戶聽歌統計"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        verbose_name="用戶",
        related_name="listening_stats"
    )
    total_listening_time = models.BigIntegerField(default=0, verbose_name="總聽歌時間(秒)")
    total_tracks_played = models.IntegerField(default=0, verbose_name="播放歌曲總數")
    total_tracks_completed = models.IntegerField(default=0, verbose_name="完整播放歌曲數")
    favorite_genre = models.CharField(max_length=100, blank=True, verbose_name="最喜愛曲風")
    most_played_track = models.ForeignKey(
        JamendoTrack, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="最常播放的歌曲"
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    
    class Meta:
        db_table = 'user_listening_stats'
        verbose_name = "用戶聽歌統計"
        verbose_name_plural = "用戶聽歌統計"
    
    def __str__(self):
        return f"{self.user.username} 的聽歌統計"
    
    @property
    def total_listening_time_formatted(self):
        """格式化總聽歌時間"""
        total_seconds = self.total_listening_time
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        else:
            return f"{minutes:02d}:{seconds:02d}"
    
    @property
    def completion_rate(self):
        """計算播放完成率"""
        if self.total_tracks_played > 0:
            return (self.total_tracks_completed / self.total_tracks_played) * 100
        return 0
    
    def update_stats(self):
        """更新統計數據"""
        from django.db.models import Sum, Count, Q
        
        # 獲取用戶的播放歷史
        play_history = UserPlayHistory.objects.filter(user=self.user)
        
        # 計算總聽歌時間
        total_time = play_history.aggregate(
            total=Sum('duration_played')
        )['total'] or 0
        
        # 計算播放歌曲總數和完整播放數
        track_stats = play_history.aggregate(
            total_played=Count('id'),
            completed=Count('id', filter=Q(completed=True))
        )
        
        # 找出最喜愛的曲風
        genre_stats = {}
        for history in play_history.select_related('track'):
            for genre in history.track.genres_list:
                genre_stats[genre] = genre_stats.get(genre, 0) + 1
        
        favorite_genre = max(genre_stats, key=genre_stats.get) if genre_stats else ''
        
        # 找出最常播放的歌曲
        most_played = play_history.values('track').annotate(
            play_count=Count('track')
        ).order_by('-play_count').first()
        
        most_played_track = None
        if most_played:
            most_played_track = JamendoTrack.objects.get(id=most_played['track'])
        
        # 更新統計數據
        self.total_listening_time = total_time
        self.total_tracks_played = track_stats['total_played']
        self.total_tracks_completed = track_stats['completed']
        self.favorite_genre = favorite_genre
        self.most_played_track = most_played_track
        self.save()

class SystemSettings(models.Model):
    """系統設置"""
    key = models.CharField(max_length=100, unique=True, verbose_name="設置鍵")
    value = models.TextField(verbose_name="設置值")
    description = models.TextField(blank=True, verbose_name="描述")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="創建時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    
    class Meta:
        db_table = 'system_settings'
        verbose_name = "系統設置"
        verbose_name_plural = "系統設置"
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key}: {self.value[:50]}..."
    
    @classmethod
    def get_setting(cls, key, default=None):
        """獲取設置值"""
        try:
            setting = cls.objects.get(key=key)
            return setting.value
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_setting(cls, key, value, description=''):
        """設置值"""
        setting, created = cls.objects.update_or_create(
            key=key,
            defaults={
                'value': str(value),
                'description': description
            }
        )
        return setting

# 信號處理器，用於自動更新統計數據
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=UserPlayHistory)
def update_user_stats_on_play(sender, instance, created, **kwargs):
    """播放歷史創建或更新時，更新用戶統計"""
    if instance.user:
        stats, created = UserListeningStats.objects.get_or_create(user=instance.user)
        # 使用 Celery 任務異步更新統計（如果有的話）
        # update_user_stats_task.delay(instance.user.id)
        stats.update_stats()

@receiver(post_save, sender=UserFavoriteTrack)
def update_track_stats_on_favorite(sender, instance, created, **kwargs):
    """收藏時更新音軌統計"""
    if created:
        track = instance.track
        track.stats_playlisted += 1
        track.save(update_fields=['stats_playlisted'])

@receiver(post_delete, sender=UserFavoriteTrack)
def update_track_stats_on_unfavorite(sender, instance, **kwargs):
    """取消收藏時更新音軌統計"""
    track = instance.track
    track.stats_playlisted = max(0, track.stats_playlisted - 1)
    track.save(update_fields=['stats_playlisted'])