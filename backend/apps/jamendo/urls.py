# backend/apps/jamendo/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # 基本端點
    path('config/', views.get_jamendo_config, name='jamendo-config'),
    path('health/', views.health_check, name='jamendo-health'),
    
    # API 代理端點（如果需要）
    path('proxy/', views.jamendo_api_proxy, name='jamendo-proxy'),
    
    # 專用端點
    path('search/', views.search_tracks, name='jamendo-search'),
    path('tracks/tag/', views.tracks_by_tag, name='jamendo-tracks-by-tag'),
    path('tracks/popular/', views.popular_tracks, name='jamendo-popular'),
    path('tracks/latest/', views.latest_tracks, name='jamendo-latest'),
    path('tracks/random/', views.random_tracks, name='jamendo-random'),
    path('tracks/<int:track_id>/', views.get_track_detail, name='jamendo-track-detail'),
    
    # 新增端點
    path('tags/', views.get_available_tags, name='jamendo-tags'),
]