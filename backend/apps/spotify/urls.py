# backend/apps/spotify/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('token/', views.exchange_code_for_token, name='spotify-token'),
    path('refresh/', views.refresh_access_token, name='spotify-refresh'),
    path('config/', views.get_spotify_config, name='spotify-config'),
    path('proxy/', views.spotify_api_proxy, name='spotify-proxy'),
]