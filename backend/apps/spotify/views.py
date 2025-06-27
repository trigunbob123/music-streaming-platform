# backend/apps/spotify/views.py
import requests
import base64
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import json

# Spotify API 配置
SPOTIFY_CLIENT_ID = getattr(settings, 'SPOTIFY_CLIENT_ID', '')
SPOTIFY_CLIENT_SECRET = getattr(settings, 'SPOTIFY_CLIENT_SECRET', '')
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

def get_spotify_headers():
    """獲取 Spotify API 基本認證標頭"""
    credentials = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    return {
        'Authorization': f'Basic {encoded_credentials}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

@csrf_exempt
@require_http_methods(["POST"])
def exchange_code_for_token(request):
    """交換授權碼獲取 access token"""
    try:
        data = json.loads(request.body)
        code = data.get('code')
        redirect_uri = data.get('redirect_uri')
        
        if not code or not redirect_uri:
            return JsonResponse({'error': '缺少必要參數'}, status=400)
        
        # 向 Spotify 請求 token
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri
        }
        
        response = requests.post(
            SPOTIFY_TOKEN_URL,
            data=token_data,
            headers=get_spotify_headers()
        )
        
        if response.status_code == 200:
            token_info = response.json()
            return JsonResponse({
                'access_token': token_info.get('access_token'),
                'refresh_token': token_info.get('refresh_token'),
                'expires_in': token_info.get('expires_in'),
                'token_type': token_info.get('token_type')
            })
        else:
            return JsonResponse({
                'error': '獲取 token 失敗',
                'details': response.json()
            }, status=400)
            
    except Exception as e:
        return JsonResponse({
            'error': '服務器錯誤',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def refresh_access_token(request):
    """刷新 access token"""
    try:
        data = json.loads(request.body)
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return JsonResponse({'error': '缺少 refresh_token'}, status=400)
        
        # 向 Spotify 請求刷新 token
        token_data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token
        }
        
        response = requests.post(
            SPOTIFY_TOKEN_URL,
            data=token_data,
            headers=get_spotify_headers()
        )
        
        if response.status_code == 200:
            token_info = response.json()
            return JsonResponse({
                'access_token': token_info.get('access_token'),
                'expires_in': token_info.get('expires_in'),
                'token_type': token_info.get('token_type'),
                # 有時候 Spotify 會返回新的 refresh_token
                'refresh_token': token_info.get('refresh_token', refresh_token)
            })
        else:
            return JsonResponse({
                'error': '刷新 token 失敗',
                'details': response.json()
            }, status=400)
            
    except Exception as e:
        return JsonResponse({
            'error': '服務器錯誤',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_spotify_config(request):
    """獲取 Spotify 配置信息"""
    return JsonResponse({
        'client_id': SPOTIFY_CLIENT_ID,
        'available': bool(SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET)
    })

@csrf_exempt
@require_http_methods(["POST"])
def spotify_api_proxy(request):
    """Spotify API 代理（可選，用於避免 CORS 問題）"""
    try:
        data = json.loads(request.body)
        endpoint = data.get('endpoint')
        method = data.get('method', 'GET')
        access_token = data.get('access_token')
        payload = data.get('payload')
        
        if not endpoint or not access_token:
            return JsonResponse({'error': '缺少必要參數'}, status=400)
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        url = f'https://api.spotify.com/v1{endpoint}'
        
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=payload)
        elif method.upper() == 'PUT':
            response = requests.put(url, headers=headers, json=payload)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            return JsonResponse({'error': '不支持的 HTTP 方法'}, status=405)
        
        # 返回 Spotify API 的響應
        if response.status_code < 400:
            try:
                return JsonResponse(response.json())
            except:
                return JsonResponse({'success': True})
        else:
            return JsonResponse({
                'error': 'Spotify API 錯誤',
                'status': response.status_code,
                'details': response.text
            }, status=response.status_code)
            
    except Exception as e:
        return JsonResponse({
            'error': '服務器錯誤',
            'message': str(e)
        }, status=500)