import axios from 'axios'

// 建立 axios 實例
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

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
    console.log('API 響應成功:', response.data)
    return response
  },
  (error) => {
    console.error('API 請求錯誤:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// 音樂 API 服務
export const musicAPI = {
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