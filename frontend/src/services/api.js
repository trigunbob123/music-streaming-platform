
import axios from 'axios'

// 🚂 Railway 部署 API 配置
const getApiBaseURL = () => {
  // 檢查是否在 Railway 生產環境
  if (import.meta.env.PROD) {
    // 生產環境：前後端在同一個域名，使用相對路徑
    return window.location.origin
  }
  
  // 開發環境：後端在不同端口
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000'
  } else {
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
console.log('🚂 部署環境:', import.meta.env.PROD ? 'Railway Production' : 'Development')
console.log('🌐 API Base URL:', getApiBaseURL())
console.log('🌐 Current Origin:', window.location.origin)

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    if (!import.meta.env.PROD) {
      console.log('📤 API 請求:', {
        method: config.method.toUpperCase(),
        url: config.url,
        fullURL: config.baseURL + config.url
      })
    }
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
    if (!import.meta.env.PROD) {
      console.log('✅ API 響應成功:', {
        status: response.status,
        url: response.config.url,
        dataLength: response.data?.results?.length || response.data?.length || 'N/A'
      })
    }
    return response
  },
  (error) => {
    // 生產環境簡化錯誤日誌
    const errorInfo = {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    }
    
    if (import.meta.env.PROD) {
      console.error('❌ API 錯誤:', errorInfo)
    } else {
      console.error('❌ API 請求錯誤詳情:', {
        ...errorInfo,
        code: error.code,
        statusText: error.response?.statusText,
        data: error.response?.data,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      })
      
      // 開發環境錯誤提示
      if (error.code === 'ERR_NETWORK') {
        console.error('🔗 網路連接錯誤: 請確認後端服務器是否在運行')
      }
    }
    
    return Promise.reject(error)
  }
)

// 連接測試函數
export const testConnection = async () => {
  try {
    console.log('🔄 開始 Railway 連接測試...')
    
    const healthResponse = await apiClient.get('/api/health/', {
      timeout: 10000
    })
    
    console.log('🎉 Railway 連接測試成功:', {
      status: healthResponse.status,
      environment: healthResponse.data?.environment,
      features: healthResponse.data?.features
    })
    
    return true
  } catch (error) {
    console.error('❌ Railway 連接測試失敗:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    })
    
    return false
  }
}

// 錯誤處理包裝器
const handleApiCall = async (apiCall, fallbackData = []) => {
  try {
    const response = await apiCall()
    return {
      success: true,
      data: response.data,
      error: null
    }
  } catch (error) {
    if (!import.meta.env.PROD) {
      console.error('API 調用失敗:', error)
    }
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
  
  // 獲取所有歌曲
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
  
  // 直接 API 請求
  rawRequest: async (endpoint) => {
    console.log('🔧 直接 API 請求:', endpoint)
    try {
      const response = await apiClient.get(endpoint)
      if (!import.meta.env.PROD) {
        console.log('✅ 直接請求成功:', response.data)
      }
      return response
    } catch (error) {
      console.error('❌ 直接請求失敗:', error)
      throw error
    }
  }
}

// 導出
export { apiClient, getApiBaseURL }
export default apiClient

// 開發環境調試工具
if (!import.meta.env.PROD) {
  window.musicAPI = musicAPI
  window.apiClient = apiClient
  console.log('🔧 開發模式: API 調試工具已暴露')
}