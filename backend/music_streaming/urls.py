# backend/music_streaming/urls.py (更新版本)
"""
URL configuration for music_streaming project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_health_check(request):
    """API 健康檢查端點"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'DDM360 Music Streaming API is running',
        'version': '2.0.0',
        'features': {
            'jamendo_integration': True,
            'music_streaming': True,
            'user_management': True,
            'playlists': True
        }
    })

urlpatterns = [
    # 管理後台
    path('admin/', admin.site.urls),
    
    # API 健康檢查
    path('api/health/', api_health_check, name='api-health'),
    
    # 原有的 API 端點
    path('api/music/', include('apps.music.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/playlists/', include('apps.playlists.urls')),
    
    # 新增 Jamendo API 端點（替代 Spotify）
    path('api/jamendo/', include('apps.jamendo.urls')),
]

# 添加媒體文件服務
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)