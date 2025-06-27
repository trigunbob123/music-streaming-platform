import axios from 'axios'

// 🔧 動態 API 基礎 URL 配置
const getApiBaseURL = () => {
  const hostname = window.location.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000'
  } else {
    // 使用當前主機的 IP，但改為 8000 端口
    return `http://${hostname}:8000`
  }
}

// 建立 axios 實例
const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// 調試信息
console.log('🌐 API Base URL:', getApiBaseURL())
console.log('🌐 Current Hostname:', window.location.hostname)

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('📤 發送 API 請求:', {
      method: config.method.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url
    })
    return config
  },
  (error) => {
    console.error('📤 請求攔截器錯誤:', error)
    return Promise.reject(error)
  }
)

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API 響應成功:', {
      status: response.status,
      url: response.config.url,
      dataLength: Array.isArray(response.data?.results) 
        ? response.data.results.length 
        : Array.isArray(response.data) 
          ? response.data.length 
          : 'N/A',
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ API 請求錯誤詳情:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    })
    
    // 根據錯誤類型提供更詳細的錯誤信息
    if (error.code === 'ERR_NETWORK') {
      console.error('🔗 網路連接錯誤: 無法連接到後端服務器')
      console.error(`請確認後端服務器是否在 ${getApiBaseURL()} 運行`)
      console.error('可能的解決方案:')
      console.error('1. 檢查後端服務器是否啟動')
      console.error('2. 檢查防火牆設置')
      console.error('3. 檢查網絡連接')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 連接被拒絕: 後端服務器可能未啟動')
    } else if (error.response?.status === 404) {
      console.error('🔍 API 端點不存在:', error.config?.url)
    } else if (error.response?.status === 500) {
      console.error('🐛 服務器內部錯誤')
    }
    
    return Promise.reject(error)
  }
)

// ✅ 添加 testConnection 函數
export const testConnection = async () => {
  try {
    console.log('🔄 開始後端連接測試...')
    
    // 首先測試基本連接
    const healthResponse = await apiClient.get('/api/music/songs/', {
      timeout: 10000 // 10秒超時
    })
    
    console.log('🎉 後端連接測試成功:', {
      status: healthResponse.status,
      songsCount: healthResponse.data?.results?.length || healthResponse.data?.length || 0
    })
    
    return true
  } catch (error) {
    console.error('❌ 後端連接測試失敗:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    })
    
    // 嘗試其他可能的端點
    try {
      console.log('🔄 嘗試管理面板連接...')
      const adminResponse = await apiClient.get('/admin/', { timeout: 5000 })
      console.log('✅ 管理面板可訪問，但 API 端點可能有問題')
      return false
    } catch (adminError) {
      console.error('❌ 管理面板也無法訪問，服務器可能未啟動')
      return false
    }
  }
}

// 🔧 改進的錯誤處理包裝器
const handleApiCall = async (apiCall, fallbackData = []) => {
  try {
    const response = await apiCall()
    return {
      success: true,
      data: response.data,
      error: null
    }
  } catch (error) {
    console.error('API 調用失敗:', error)
    return {
      success: false,
      data: fallbackData,
      error: error.message || '未知錯誤'
    }
  }
}

// 音樂 API 服務
export const musicAPI = {
  // 測試連接
  testConnection,
  
  // 獲取所有歌曲（帶錯誤處理）
  getAllSongs: async () => {
    console.log('📀 請求所有歌曲...')
    return handleApiCall(
      () => apiClient.get('/api/music/songs/'),
      []
    )
  },
  
  // 按曲風獲取歌曲
  getSongsByGenre: async (genre) => {
    console.log('🎵 請求曲風歌曲:', genre)
    return handleApiCall(
      () => apiClient.get(`/api/music/songs/by_genre/?genre=${encodeURIComponent(genre)}`),
      []
    )
  },
  
  // 獲取隨機歌曲
  getRandomSongs: async (count = 6) => {
    console.log('🎲 請求隨機歌曲:', count, '首')
    return handleApiCall(
      () => apiClient.get(`/api/music/songs/random/?count=${count}`),
      []
    )
  },
  
  // 獲取最新歌曲
  getLatestSongs: async (count = 6) => {
    console.log('🆕 請求最新歌曲:', count, '首')
    return handleApiCall(
      () => apiClient.get(`/api/music/songs/?ordering=-created_at&limit=${count}`),
      []
    )
  },
  
  // 搜尋歌曲
  searchSongs: async (query) => {
    console.log('🔍 搜尋歌曲:', query)
    return handleApiCall(
      () => apiClient.get(`/api/music/songs/?search=${encodeURIComponent(query)}`),
      []
    )
  },
  
  // 獲取單首歌曲詳情
  getSongDetail: async (songId) => {
    console.log('🎵 獲取歌曲詳情:', songId)
    return handleApiCall(
      () => apiClient.get(`/api/music/songs/${songId}/`),
      null
    )
  },
  
  // 🔧 新增：直接API調用（用於調試）
  rawRequest: async (endpoint) => {
    console.log('🔧 直接 API 請求:', endpoint)
    try {
      const response = await apiClient.get(endpoint)
      console.log('✅ 直接請求成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 直接請求失敗:', error)
      throw error
    }
  }
}

// 🔧 導出 API 客戶端以供其他用途
export { apiClient, getApiBaseURL }

// 🔧 導出默認實例
export default apiClient

// 🧪 開發環境下的額外調試工具
if (process.env.NODE_ENV === 'development') {
  // 將 API 客戶端暴露到全局，方便在瀏覽器控制台調試
  window.musicAPI = musicAPI
  window.apiClient = apiClient
  
  console.log('🔧 開發模式: API 調試工具已暴露到 window.musicAPI 和 window.apiClient')
}