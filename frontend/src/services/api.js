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
  timeout: 15000,
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
    console.log('發送 API 請求:', config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API 響應成功:', response.data)
    return response
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ 網路連接錯誤: 無法連接到後端服務器')
      console.error(`請確認後端服務器是否在 ${getApiBaseURL()} 運行`)
    } else {
      console.error('❌ API 請求錯誤:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      })
    }
    return Promise.reject(error)
  }
)

// ✅ 添加 testConnection 函數
export const testConnection = async () => {
  try {
    const response = await apiClient.get('/api/music/songs/')
    console.log('🎉 後端連接測試成功')
    return true
  } catch (error) {
    console.error('❌ 後端連接測試失敗:', error.message)
    return false
  }
}

// 音樂 API 服務
export const musicAPI = {
  // 測試連接
  testConnection,
  
  // 獲取所有歌曲
  getAllSongs: () => apiClient.get('/api/music/songs/'),
  
  // 按曲風獲取歌曲
  getSongsByGenre: (genre) => apiClient.get(`/api/music/songs/by_genre/?genre=${genre}`),
  
  // 獲取隨機歌曲
  getRandomSongs: (count = 6) => apiClient.get(`/api/music/songs/random/?count=${count}`),
  
  // 獲取最新歌曲
  getLatestSongs: (count = 6) => apiClient.get(`/api/music/songs/?ordering=-created_at&limit=${count}`),
  
  // 搜尋歌曲
  searchSongs: (query) => apiClient.get(`/api/music/songs/?search=${query}`),
}

export default apiClient