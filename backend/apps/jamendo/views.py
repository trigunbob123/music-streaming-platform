
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.core.cache import cache
import json
import logging
import hashlib

logger = logging.getLogger(__name__)

# Jamendo API 配置
JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0'
JAMENDO_CLIENT_ID = getattr(settings, 'JAMENDO_CLIENT_ID', '')

def get_jamendo_headers():
    """獲取 Jamendo API 請求標頭"""
    return {
        'User-Agent': 'DDM360-Music-Streaming/1.0',
        'Accept': 'application/json',
    }

def get_cache_key(endpoint, params):
    """生成緩存鍵"""
    cache_string = f"{endpoint}_{json.dumps(sorted(params.items()))}"
    return hashlib.md5(cache_string.encode()).hexdigest()

def jamendo_api_request(endpoint, params, cache_timeout=3600):
    """統一的 Jamendo API 請求函數，帶緩存"""
    # 生成緩存鍵
    cache_key = get_cache_key(endpoint, params)
    
    # 嘗試從緩存獲取
    cached_data = cache.get(f"jamendo_{cache_key}")
    if cached_data:
        logger.info(f'從緩存返回數據: {endpoint}')
        return cached_data
    
    # 添加必要的參數
    final_params = {
        'client_id': JAMENDO_CLIENT_ID,
        'format': 'json',
        **params
    }
    
    url = f'{JAMENDO_API_BASE}/{endpoint.lstrip("/")}'
    
    try:
        logger.info(f'Jamendo API 請求: {url} with params: {final_params}')
        
        response = requests.get(
            url,
            params=final_params,
            headers=get_jamendo_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # 數據後處理：確保所有曲目都有必要字段
            if 'results' in data:
                for track in data['results']:
                    # 確保圖片字段
                    if not track.get('image') and track.get('album_image'):
                        track['image'] = track['album_image']
                    
                    # 確保時長字段
                    if not track.get('duration'):
                        track['duration'] = 180  # 默認3分鐘
                    
                    # 格式化藝人信息
                    if not track.get('artist_name'):
                        track['artist_name'] = 'Unknown Artist'
                    
                    # 格式化專輯信息
                    if not track.get('album_name'):
                        track['album_name'] = 'Unknown Album'
            
            # 緩存數據
            cache.set(f"jamendo_{cache_key}", data, cache_timeout)
            
            logger.info(f'Jamendo API 響應成功: {len(data.get("results", []))} 項結果')
            return data
        else:
            logger.error(f'Jamendo API 錯誤: {response.status_code} - {response.text}')
            return None
            
    except requests.exceptions.Timeout:
        logger.error('Jamendo API 請求超時')
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f'Jamendo API 請求異常: {str(e)}')
        return None

@csrf_exempt
@require_http_methods(["GET"])
def get_jamendo_config(request):
    """獲取 Jamendo 配置信息"""
    return JsonResponse({
        'client_id': JAMENDO_CLIENT_ID,
        'available': bool(JAMENDO_CLIENT_ID),
        'api_base': JAMENDO_API_BASE,
        'status': 'configured' if JAMENDO_CLIENT_ID else 'not_configured'
    })

@csrf_exempt
@require_http_methods(["GET"])
def search_tracks(request):
    """搜尋音軌"""
    search_query = request.GET.get('q', '')
    limit = min(int(request.GET.get('limit', 20)), 200)
    
    if not search_query:
        return JsonResponse({'error': '缺少搜尋查詢'}, status=400)
    
    if not JAMENDO_CLIENT_ID:
        return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
    
    params = {
        'search': search_query,
        'include': 'musicinfo',
        'audioformat': 'mp32',
        'limit': limit
    }
    
    data = jamendo_api_request('tracks', params)
    
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({'error': 'Jamendo API 錯誤'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def tracks_by_tag(request):
    """按標籤獲取音軌"""
    tag = request.GET.get('tag', '')
    limit = min(int(request.GET.get('limit', 20)), 200)
    
    if not tag:
        return JsonResponse({'error': '缺少標籤參數'}, status=400)
    
    if not JAMENDO_CLIENT_ID:
        return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
    
    params = {
        'tags': tag,
        'include': 'musicinfo',
        'audioformat': 'mp32',
        'limit': limit
    }
    
    data = jamendo_api_request('tracks', params, cache_timeout=7200)  # 2小時緩存
    
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({'error': 'Jamendo API 錯誤'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def popular_tracks(request):
    """獲取熱門音軌"""
    limit = min(int(request.GET.get('limit', 20)), 200)
    
    if not JAMENDO_CLIENT_ID:
        return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
    
    params = {
        'order': 'popularity_total',
        'include': 'musicinfo',
        'audioformat': 'mp32',
        'limit': limit
    }
    
    data = jamendo_api_request('tracks', params, cache_timeout=3600)  # 1小時緩存
    
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({'error': 'Jamendo API 錯誤'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def latest_tracks(request):
    """獲取最新音軌"""
    limit = min(int(request.GET.get('limit', 20)), 200)
    
    if not JAMENDO_CLIENT_ID:
        return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
    
    params = {
        'order': 'releasedate_desc',
        'include': 'musicinfo',
        'audioformat': 'mp32',
        'limit': limit
    }
    
    data = jamendo_api_request('tracks', params, cache_timeout=1800)  # 30分鐘緩存
    
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({'error': 'Jamendo API 錯誤'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def random_tracks(request):
    """獲取隨機音軌"""
    limit = min(int(request.GET.get('limit', 20)), 200)
    
    if not JAMENDO_CLIENT_ID:
        return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
    
    params = {
        'order': 'random',
        'include': 'musicinfo',
        'audioformat': 'mp32',
        'limit': limit
    }
    
    # 隨機音軌不使用緩存
    url = f'{JAMENDO_API_BASE}/tracks'
    final_params = {
        'client_id': JAMENDO_CLIENT_ID,
        'format': 'json',
        **params
    }
    
    try:
        response = requests.get(url, params=final_params, headers=get_jamendo_headers(), timeout=30)
        if response.status_code == 200:
            data = response.json()
            return JsonResponse(data)
        else:
            return JsonResponse({'error': 'Jamendo API 錯誤'}, status=500)
    except Exception as e:
        logger.error(f'獲取隨機音軌錯誤: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_track_detail(request, track_id):
    """獲取音軌詳情"""
    if not JAMENDO_CLIENT_ID:
        return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
    
    params = {
        'id': track_id,
        'include': 'musicinfo+stats+lyrics',
        'audioformat': 'mp32'
    }
    
    data = jamendo_api_request('tracks', params, cache_timeout=86400)  # 24小時緩存
    
    if data and data.get('results'):
        return JsonResponse(data['results'][0])
    else:
        return JsonResponse({'error': '找不到音軌'}, status=404)

@csrf_exempt  
@require_http_methods(["GET"])
def get_available_tags(request):
    """獲取可用的音樂標籤 - 使用 Jamendo 官方推薦曲風"""
    if not JAMENDO_CLIENT_ID:
        return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
    
    # Jamendo API 官方推薦的曲風標籤
    # 來源：https://developer.jamendo.com/v3.0/tracks
    jamendo_featured_genres = [
        'pop',        # 流行音樂 - 最受歡迎的主流音樂
        'rock',       # 搖滾音樂 - 經典搖滾風格
        'electronic', # 電子音樂 - 電子合成器音樂
        'jazz',       # 爵士音樂 - 爵士樂風格
        'classical',  # 古典音樂 - 古典樂曲
        'hiphop',     # 嘻哈音樂 - 說唱和節拍音樂
        'metal',      # 金屬音樂 - 重金屬音樂
        'world',      # 世界音樂 - 各國民族音樂
        'soundtrack', # 配樂音樂 - 電影配樂等
        'lounge'      # 休閒音樂 - 輕鬆氛圍音樂
    ]
    
    return JsonResponse({
        'results': jamendo_featured_genres,
        'count': len(jamendo_featured_genres),
        'source': 'jamendo_official_featured_genres',
        'description': 'Jamendo API 官方推薦的特色曲風標籤'
    })
@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """健康檢查端點"""
    if not JAMENDO_CLIENT_ID:
        return JsonResponse({
            'status': 'error',
            'jamendo_api': 'not_configured',
            'error': 'JAMENDO_CLIENT_ID 未設置'
        }, status=500)
    
    # 測試 Jamendo API 連接
    try:
        data = jamendo_api_request('tracks', {'limit': 1}, cache_timeout=60)
        
        if data:
            return JsonResponse({
                'status': 'healthy',
                'jamendo_api': 'connected',
                'client_id_configured': True,
                'api_base': JAMENDO_API_BASE,
                'cache_enabled': True
            })
        else:
            return JsonResponse({
                'status': 'error',
                'jamendo_api': 'failed',
                'error': 'API 請求失敗',
                'client_id_configured': True
            }, status=500)
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'jamendo_api': 'failed',
            'error': str(e),
            'client_id_configured': bool(JAMENDO_CLIENT_ID)
        }, status=500)
    
def jamendo_api_proxy(request):
    return JsonResponse({'message': '這是 Jamendo Proxy API 的回應'})