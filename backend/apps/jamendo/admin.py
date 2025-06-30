# backend/apps/jamendo/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import JamendoTrack, UserFavoriteTrack, UserPlayHistory
import json

@admin.register(JamendoTrack)
class JamendoTrackAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'artist_name', 
        'album_name', 
        'duration_display', 
        'stats_rate', 
        'stats_downloads_total',
        'cached_at',
        'audio_preview'
    ]
    list_filter = [
        'cached_at', 
        'stats_rate', 
        'releasedate',
        'stats_downloads_total'
    ]
    search_fields = [
        'name', 
        'artist_name', 
        'album_name',
        'jamendo_id'
    ]
    readonly_fields = [
        'jamendo_id', 
        'cached_at', 
        'created_at',
        'audio_preview',
        'image_preview',
        'tags_display',
        'stats_display'
    ]
    
    fieldsets = (
        ('基本信息', {
            'fields': (
                'jamendo_id',
                'name',
                'artist_name',
                'artist_id',
                'album_name',
                'album_id',
                'position',
                'duration',
                'releasedate'
            )
        }),
        ('媒體文件', {
            'fields': (
                'audio',
                'audiodownload',
                'audio_preview',
                'image',
                'album_image',
                'image_preview'
            )
        }),
        ('標籤和分類', {
            'fields': (
                'musicinfo_tags_genres',
                'musicinfo_tags_instruments',
                'musicinfo_tags_vartags',
                'tags_display'
            ),
            'classes': ('collapse',)
        }),
        ('統計信息', {
            'fields': (
                'stats_rate',
                'stats_downloads_total',
                'stats_playlisted',
                'stats_display'
            )
        }),
        ('系統信息', {
            'fields': (
                'cached_at',
                'created_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    def duration_display(self, obj):
        """格式化顯示時長"""
        if obj.duration:
            minutes = obj.duration // 60
            seconds = obj.duration % 60
            return f"{minutes:02d}:{seconds:02d}"
        return "00:00"
    duration_display.short_description = "時長"
    
    def audio_preview(self, obj):
        """音頻預覽播放器"""
        if obj.audio:
            return format_html(
                '<audio controls style="width: 300px;">'
                '<source src="{}" type="audio/mpeg">'
                '你的瀏覽器不支持音頻播放。'
                '</audio>',
                obj.audio
            )
        return "無音頻文件"
    audio_preview.short_description = "音頻預覽"
    
    def image_preview(self, obj):
        """圖片預覽"""
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"/>',
                obj.image
            )
        return "無圖片"
    image_preview.short_description = "封面預覽"
    
    def tags_display(self, obj):
        """格式化顯示標籤"""
        tags_info = []
        
        if obj.musicinfo_tags_genres:
            try:
                genres = json.loads(obj.musicinfo_tags_genres)
                if genres:
                    tags_info.append(f"<strong>曲風:</strong> {', '.join(genres)}")
            except:
                pass
        
        if obj.musicinfo_tags_instruments:
            try:
                instruments = json.loads(obj.musicinfo_tags_instruments)
                if instruments:
                    tags_info.append(f"<strong>樂器:</strong> {', '.join(instruments)}")
            except:
                pass
        
        if obj.musicinfo_tags_vartags:
            try:
                vartags = json.loads(obj.musicinfo_tags_vartags)
                if vartags:
                    tags_info.append(f"<strong>其他標籤:</strong> {', '.join(vartags)}")
            except:
                pass
        
        return mark_safe('<br>'.join(tags_info)) if tags_info else "無標籤信息"
    tags_display.short_description = "標籤信息"
    
    def stats_display(self, obj):
        """格式化顯示統計信息"""
        stats_html = f"""
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <div><strong>評分:</strong> {obj.stats_rate:.2f}/5.0</div>
            <div><strong>下載次數:</strong> {obj.stats_downloads_total:,}</div>
            <div><strong>收藏次數:</strong> {obj.stats_playlisted:,}</div>
        </div>
        """
        return mark_safe(stats_html)
    stats_display.short_description = "詳細統計"
    
    def get_queryset(self, request):
        """優化查詢性能"""
        return super().get_queryset(request).select_related()
    
    actions = ['update_cache', 'clear_low_rated']
    
    def update_cache(self, request, queryset):
        """更新緩存時間"""
        count = queryset.update(cached_at=timezone.now())
        self.message_user(request, f'已更新 {count} 首歌曲的緩存時間。')
    update_cache.short_description = "更新選中項目的緩存時間"
    
    def clear_low_rated(self, request, queryset):
        """清除低評分歌曲"""
        count = queryset.filter(stats_rate__lt=2.0).delete()[0]
        self.message_user(request, f'已刪除 {count} 首低評分歌曲。')
    clear_low_rated.short_description = "刪除評分低於2.0的歌曲"

@admin.register(UserFavoriteTrack)
class UserFavoriteTrackAdmin(admin.ModelAdmin):
    list_display = [
        'user', 
        'track_name', 
        'track_artist', 
        'created_at'
    ]
    list_filter = [
        'created_at',
        'track__stats_rate'
    ]
    search_fields = [
        'user__username', 
        'user__email',
        'track__name', 
        'track__artist_name'
    ]
    readonly_fields = ['created_at']
    
    def track_name(self, obj):
        """顯示歌曲名稱"""
        return obj.track.name
    track_name.short_description = "歌曲名稱"
    
    def track_artist(self, obj):
        """顯示藝人名稱"""
        return obj.track.artist_name
    track_artist.short_description = "藝人"
    
    def get_queryset(self, request):
        """優化查詢性能"""
        return super().get_queryset(request).select_related('user', 'track')

@admin.register(UserPlayHistory)
class UserPlayHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'user_display',
        'track_name', 
        'track_artist', 
        'played_at',
        'duration_played_display',
        'completion_rate',
        'completed'
    ]
    list_filter = [
        'played_at',
        'completed',
        'track__stats_rate'
    ]
    search_fields = [
        'user__username',
        'user__email', 
        'session_id',
        'track__name', 
        'track__artist_name'
    ]
    readonly_fields = [
        'played_at',
        'completion_rate_display',
        'track_details'
    ]
    
    fieldsets = (
        ('播放信息', {
            'fields': (
                'user',
                'session_id',
                'track',
                'played_at'
            )
        }),
        ('播放統計', {
            'fields': (
                'duration_played',
                'completed',
                'completion_rate_display'
            )
        }),
        ('歌曲詳情', {
            'fields': ('track_details',),
            'classes': ('collapse',)
        })
    )
    
    def user_display(self, obj):
        """顯示用戶信息"""
        if obj.user:
            return f"{obj.user.username} ({obj.user.email})"
        else:
            return f"匿名用戶 (Session: {obj.session_id[:8]}...)"
    user_display.short_description = "用戶"
    
    def track_name(self, obj):
        """顯示歌曲名稱"""
        return obj.track.name
    track_name.short_description = "歌曲"
    
    def track_artist(self, obj):
        """顯示藝人名稱"""
        return obj.track.artist_name
    track_artist.short_description = "藝人"
    
    def duration_played_display(self, obj):
        """格式化顯示播放時長"""
        if obj.duration_played:
            minutes = obj.duration_played // 60
            seconds = obj.duration_played % 60
            return f"{minutes:02d}:{seconds:02d}"
        return "00:00"
    duration_played_display.short_description = "播放時長"
    
    def completion_rate(self, obj):
        """計算完成率"""
        if obj.track.duration and obj.duration_played:
            rate = (obj.duration_played / obj.track.duration) * 100
            return f"{rate:.1f}%"
        return "0%"
    completion_rate.short_description = "完成率"
    
    def completion_rate_display(self, obj):
        """詳細的完成率顯示"""
        if obj.track.duration and obj.duration_played:
            rate = (obj.duration_played / obj.track.duration) * 100
            total_duration = f"{obj.track.duration // 60:02d}:{obj.track.duration % 60:02d}"
            played_duration = f"{obj.duration_played // 60:02d}:{obj.duration_played % 60:02d}"
            
            color = "green" if rate >= 80 else "orange" if rate >= 50 else "red"
            
            return format_html(
                '<div style="color: {};">'
                '<strong>{:.1f}%</strong><br>'
                '<small>{} / {}</small>'
                '</div>',
                color, rate, played_duration, total_duration
            )
        return "無數據"
    completion_rate_display.short_description = "完成率詳情"
    
    def track_details(self, obj):
        """歌曲詳細信息"""
        track = obj.track
        details_html = f"""
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <h4>{track.name}</h4>
            <p><strong>藝人:</strong> {track.artist_name}</p>
            <p><strong>專輯:</strong> {track.album_name or '未知專輯'}</p>
            <p><strong>時長:</strong> {track.duration // 60:02d}:{track.duration % 60:02d}</p>
            <p><strong>評分:</strong> {track.stats_rate:.2f}/5.0</p>
            <p><strong>下載次數:</strong> {track.stats_downloads_total:,}</p>
            {f'<img src="{track.image}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-top: 10px;"/>' if track.image else ''}
        </div>
        """
        return mark_safe(details_html)
    track_details.short_description = "歌曲詳情"
    
    def get_queryset(self, request):
        """優化查詢性能"""
        return super().get_queryset(request).select_related('user', 'track')

# 自定義 Admin 站點標題
admin.site.site_header = 'DDM360 音樂串流管理後台'
admin.site.site_title = 'DDM360 管理'
admin.site.index_title = '歡迎來到 DDM360 音樂串流管理後台'

# 添加必要的導入
from django.utils import timezone