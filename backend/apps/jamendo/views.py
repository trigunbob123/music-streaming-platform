# backend/apps/jamendo/views.py
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import json
import logging

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

@csrf_exempt
@require_http_methods(["GET"])
def get_jamendo_config(request):
    """獲取 Jamendo 配置信息"""
    return JsonResponse({
        'client_id': JAMENDO_CLIENT_ID,
        'available': bool(JAMENDO_CLIENT_ID),
        'api_base': JAMENDO_API_BASE
    })

@csrf_exempt
@require_http_methods(["GET", "POST"])
def jamendo_api_proxy(request):
    """Jamendo API 代理（可選，用於避免 CORS 問題）"""
    try:
        if request.method == 'GET':
            endpoint = request.GET.get('endpoint', '')
            params = dict(request.GET)
            params.pop('endpoint', None)  # 移除 endpoint 參數
        else:
            data = json.loads(request.body) if request.body else {}
            endpoint = data.get('endpoint', '')
            params = data.get('params', {})
        
        if not endpoint:
            return JsonResponse({'error': '缺少 endpoint 參數'}, status=400)
        
        if not JAMENDO_CLIENT_ID:
            return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
        
        # 添加必要的參數
        final_params = {
            'client_id': JAMENDO_CLIENT_ID,
            'format': 'json',
            **params
        }
        
        # 清理參數（移除空值和列表）
        clean_params = {}
        for key, value in final_params.items():
            if isinstance(value, list):
                clean_params[key] = value[0] if value else ''
            elif value:
                clean_params[key] = value
        
        url = f'{JAMENDO_API_BASE}/{endpoint.lstrip("/")}'
        
        logger.info(f'Jamendo API 請求: {url}')
        logger.info(f'參數: {clean_params}')
        
        response = requests.get(
            url,
            params=clean_params,
            headers=get_jamendo_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            try:
                data = response.json()
                logger.info(f'Jamendo API 響應: 成功，返回 {len(data.get("results", []))} 項結果')
                return JsonResponse(data)
            except json.JSONDecodeError:
                logger.error('Jamendo API 響應 JSON 解析失敗')
                return JsonResponse({'error': 'API 響應格式錯誤'}, status=500)
        else:
            logger.error(f'Jamendo API 錯誤: {response.status_code} - {response.text}')
            return JsonResponse({
                'error': 'Jamendo API 錯誤',
                'status': response.status_code,
                'details': response.text
            }, status=response.status_code)
            
    except requests.exceptions.Timeout:
        logger.error('Jamendo API 請求超時')
        return JsonResponse({'error': 'API 請求超時'}, status=504)
    except requests.exceptions.RequestException as e:
        logger.error(f'Jamendo API 請求異常: {str(e)}')
        return JsonResponse({'error': f'API 請求失敗: {str(e)}'}, status=500)
    except Exception as e:
        logger.error(f'Jamendo 代理服務器錯誤: {str(e)}')
        return JsonResponse({'error': f'服務器錯誤: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def search_tracks(request):
    """搜尋音軌"""
    try:
        search_query = request.GET.get('q', '')
        limit = min(int(request.GET.get('limit', 20)), 200)  # 限制最大數量
        
        if not search_query:
            return JsonResponse({'error': '缺少搜尋查詢'}, status=400)
        
        if not JAMENDO_CLIENT_ID:
            return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
        
        params = {
            'client_id': JAMENDO_CLIENT_ID,
            'format': 'json',
            'search': search_query,
            'include': 'musicinfo',
            'audioformat': 'mp32',
            'limit': limit
        }
        
        response = requests.get(
            f'{JAMENDO_API_BASE}/tracks',
            params=params,
            headers=get_jamendo_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return JsonResponse(data)
        else:
            return JsonResponse({'error': 'Jamendo API 錯誤'}, status=response.status_code)
            
    except ValueError:
        return JsonResponse({'error': '無效的 limit 參數'}, status=400)
    except Exception as e:
        logger.error(f'搜尋音軌錯誤: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def tracks_by_tag(request):
    """按標籤獲取音軌"""
    try:
        tag = request.GET.get('tag', '')
        limit = min(int(request.GET.get('limit', 20)), 200)
        
        if not tag:
            return JsonResponse({'error': '缺少標籤參數'}, status=400)
        
        if not JAMENDO_CLIENT_ID:
            return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
        
        params = {
            'client_id': JAMENDO_CLIENT_ID,
            'format': 'json',
            'tags': tag,
            'include': 'musicinfo',
            'audioformat': 'mp32',
            'limit': limit
        }
        
        response = requests.get(
            f'{JAMENDO_API_BASE}/tracks',
            params=params,
            headers=get_jamendo_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return JsonResponse(data)
        else:
            return JsonResponse({'error': 'Jamendo API 錯誤'}, status=response.status_code)
            
    except ValueError:
        return JsonResponse({'error': '無效的 limit 參數'}, status=400)
    except Exception as e:
        logger.error(f'按標籤獲取音軌錯誤: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def popular_tracks(request):
    """獲取熱門音軌"""
    try:
        limit = min(int(request.GET.get('limit', 20)), 200)
        
        if not JAMENDO_CLIENT_ID:
            return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
        
        params = {
            'client_id': JAMENDO_CLIENT_ID,
            'format': 'json',
            'order': 'popularity_total',
            'include': 'musicinfo',
            'audioformat': 'mp32',
            'limit': limit
        }
        
        response = requests.get(
            f'{JAMENDO_API_BASE}/tracks',
            params=params,
            headers=get_jamendo_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return JsonResponse(data)
        else:
            return JsonResponse({'error': 'Jamendo API 錯誤'}, status=response.status_code)
            
    except ValueError:
        return JsonResponse({'error': '無效的 limit 參數'}, status=400)
    except Exception as e:
        logger.error(f'獲取熱門音軌錯誤: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def latest_tracks(request):
    """獲取最新音軌"""
    try:
        limit = min(int(request.GET.get('limit', 20)), 200)
        
        if not JAMENDO_CLIENT_ID:
            return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
        
        params = {
            'client_id': JAMENDO_CLIENT_ID,
            'format': 'json',
            'order': 'releasedate_desc',
            'include': 'musicinfo',
            'audioformat': 'mp32',
            'limit': limit
        }
        
        response = requests.get(
            f'{JAMENDO_API_BASE}/tracks',
            params=params,
            headers=get_jamendo_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return JsonResponse(data)
        else:
            return JsonResponse({'error': 'Jamendo API 錯誤'}, status=response.status_code)
            
    except ValueError:
        return JsonResponse({'error': '無效的 limit 參數'}, status=400)
    except Exception as e:
        logger.error(f'獲取最新音軌錯誤: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def random_tracks(request):
    """獲取隨機音軌"""
    try:
        limit = min(int(request.GET.get('limit', 20)), 200)
        
        if not JAMENDO_CLIENT_ID:
            return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
        
        params = {
            'client_id': JAMENDO_CLIENT_ID,
            'format': 'json',
            'order': 'random',
            'include': 'musicinfo',
            'audioformat': 'mp32',
            'limit': limit
        }
        
        response = requests.get(
            f'{JAMENDO_API_BASE}/tracks',
            params=params,
            headers=get_jamendo_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return JsonResponse(data)
        else:
            return JsonResponse({'error': 'Jamendo API 錯誤'}, status=response.status_code)
            
    except ValueError:
        return JsonResponse({'error': '無效的 limit 參數'}, status=400)
    except Exception as e:
        logger.error(f'獲取隨機音軌錯誤: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_track_detail(request, track_id):
    """獲取音軌詳情"""
    try:
        if not JAMENDO_CLIENT_ID:
            return JsonResponse({'error': 'Jamendo 未配置'}, status=500)
        
        params = {
            'client_id': JAMENDO_CLIENT_ID,
            'format': 'json',
            'id': track_id,
            'include': 'musicinfo+stats+lyrics',
            'audioformat': 'mp32'
        }
        
        response = requests.get(
            f'{JAMENDO_API_BASE}/tracks',
            params=params,
            headers=get_jamendo_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('results'):
                return JsonResponse(data['results'][0])
            else:
                return JsonResponse({'error': '找不到音軌'}, status=404)
        else:
            return JsonResponse({'error': 'Jamendo API 錯誤'}, status=response.status_code)
            
    except Exception as e:
        logger.error(f'獲取音軌詳情錯誤: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """健康檢查端點"""
    try:
        if not JAMENDO_CLIENT_ID:
            return JsonResponse({
                'status': 'error',
                'jamendo_api': 'not_configured',
                'error': 'JAMENDO_CLIENT_ID 未設置'
            }, status=500)
        
        # 測試 Jamendo API 連接
        params = {
            'client_id': JAMENDO_CLIENT_ID,
            'format': 'json',
            'limit': 1
        }
        
        response = requests.get(
            f'{JAMENDO_API_BASE}/tracks',
            params=params,
            headers=get_jamendo_headers(),
            timeout=10
        )
        
        if response.status_code == 200:
            return JsonResponse({
                'status': 'healthy',
                'jamendo_api': 'connected',
                'client_id_configured': True,
                'api_base': JAMENDO_API_BASE
            })
        else:
            return JsonResponse({
                'status': 'error',
                'jamendo_api': 'failed',
                'error': f'HTTP {response.status_code}',
                'client_id_configured': True
            }, status=500)
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'jamendo_api': 'failed',
            'error': str(e),
            'client_id_configured': bool(JAMENDO_CLIENT_ID)
        }, status=500)