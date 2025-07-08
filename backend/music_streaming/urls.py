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
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.views.static import serve
import os

def api_health_check(request):
    """API 健康檢查端點"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'DDM360 Music Streaming API is running',
        'version': '2.0.0',
        'environment': os.getenv('RAILWAY_ENVIRONMENT', 'development'),
        'features': {
            'jamendo_integration': True,
            'music_streaming': True,
            'user_management': True,
            'playlists': True,
            'frontend_integrated': True
        }
    })

class FrontendView(TemplateView):
    """提供前端 Vue.js 應用程式"""
    template_name = 'index.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['api_base_url'] = '/api'
        return context

urlpatterns = [
    # 管理後台
    path('admin/', admin.site.urls),
    
    # API 健康檢查
    path('api/health/', api_health_check, name='api-health'),
    
    # API 端點
    path('api/music/', include('apps.music.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/playlists/', include('apps.playlists.urls')),
    path('api/jamendo/', include('apps.jamendo.urls')),
]

# 添加媒體文件服務
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# 前端路由處理
if not settings.DEBUG:
    # 生產環境：所有非 API 路由都導向前端
    urlpatterns += [
        # 前端靜態資源
        re_path(r'^assets/(?P<path>.*)$', serve, {
            'document_root': settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets',
        }),
        
        # 前端應用程式（catch-all）
        re_path(r'^(?!api/).*$', FrontendView.as_view(), name='frontend'),
    ]
else:
    # 開發環境：僅提供 API
    urlpatterns += [
        path('', api_health_check, name='dev-home'),
    ]