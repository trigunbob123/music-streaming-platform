from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SongViewSet

router = DefaultRouter()
router.register(r'songs', SongViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # 添加健康檢查端點
    path('health/', SongViewSet.as_view({'get': 'health'}), name='music-health'),
]