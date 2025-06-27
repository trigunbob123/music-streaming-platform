// frontend/src/composables/useSpotify.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useSpotify() {
  // 狀態管理
  const isSpotifyConnected = ref(false)
  const spotifyPlayer = ref(null)
  const deviceId = ref('')
  const accessToken = ref('')
  
  // 播放狀態
  const currentTrack = ref({})
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(50)
  const isShuffled = ref(false)
  const repeatMode = ref('off')
  
  // 設備列表
  const spotifyDevices = ref([])
  
  // 🔧 Spotify 配置
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const REDIRECT_URI = 'http://127.0.0.1:3000'
  const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ')

  // 檢查配置
  const checkConfig = () => {
    if (!CLIENT_ID) {
      console.error('❌ 未設置 VITE_SPOTIFY_CLIENT_ID')
      return false
    }
    console.log('✅ Spotify 配置檢查通過')
    console.log('Client ID:', CLIENT_ID)
    console.log('Redirect URI:', REDIRECT_URI)
    return true
  }

  // 初始化 Spotify Web SDK
  const initializeSpotifySDK = () => {
    return new Promise((resolve, reject) => {
      if (window.Spotify) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      script.onload = () => {
        console.log('✅ Spotify SDK 腳本已載入')
      }
      script.onerror = () => {
        console.error('❌ 載入 Spotify SDK 失敗')
        reject(new Error('載入 Spotify SDK 失敗'))
      }
      document.body.appendChild(script)

      // 設置全局回調
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('✅ Spotify Web SDK 已準備就緒')
        resolve()
      }

      // 10秒超時
      setTimeout(() => {
        if (!window.Spotify) {
          reject(new Error('Spotify SDK 載入超時'))
        }
      }, 10000)
    })
  }

  // 生成授權 URL
  const getAuthUrl = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      show_dialog: 'true'
    })
    
    const authUrl = `https://accounts.spotify.com/authorize?${params}`
    console.log('🔗 授權 URL:', authUrl)
    return authUrl
  }

  // 驗證 token 有效性
  const validateToken = async (token) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.ok
    } catch (error) {
      console.error('Token 驗證失敗:', error)
      return false
    }
  }

  // 🎵 連接 Spotify
  const connectSpotify = async () => {
    console.log('🎵 開始連接 Spotify...')
    
    if (!checkConfig()) {
      alert('❌ Spotify 配置錯誤，請檢查環境變數設置')
      return
    }

    try {
      // 檢查是否已有有效 token
      const storedToken = localStorage.getItem('spotify_access_token')
      if (storedToken) {
        console.log('📱 發現已存儲的 token，驗證中...')
        const isValid = await validateToken(storedToken)
        if (isValid) {
          accessToken.value = storedToken
          await initializePlayer()
          return
        } else {
          console.log('🔄 Token 已過期，清除並重新授權')
          localStorage.removeItem('spotify_access_token')
          localStorage.removeItem('spotify_refresh_token')
        }
      }

      // 重定向到 Spotify 授權頁面
      console.log('🚀 重定向到 Spotify 授權頁面...')
      window.location.href = getAuthUrl()
    } catch (error) {
      console.error('❌ 連接 Spotify 失敗:', error)
      alert('連接 Spotify 失敗: ' + error.message)
    }
  }

  // 斷開連接
  const disconnectSpotify = () => {
    console.log('🔌 斷開 Spotify 連接')
    
    if (spotifyPlayer.value) {
      spotifyPlayer.value.disconnect()
    }
    
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    
    isSpotifyConnected.value = false
    spotifyPlayer.value = null
    currentTrack.value = {}
    isPlaying.value = false
    accessToken.value = ''
  }

  // 處理授權回調
  const handleAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (error) {
      console.error('❌ Spotify 授權錯誤:', error)
      alert('Spotify 授權失敗: ' + error)
      return
    }
    
    if (code) {
      console.log('🔑 收到授權碼，交換 token...')
      try {
        // 發送到後端交換 token
        const response = await fetch('/api/spotify/token/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            redirect_uri: REDIRECT_URI
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        const data = await response.json()
        
        if (data.access_token) {
          console.log('✅ 成功獲取 access token')
          accessToken.value = data.access_token
          localStorage.setItem('spotify_access_token', data.access_token)
          
          if (data.refresh_token) {
            localStorage.setItem('spotify_refresh_token', data.refresh_token)
          }
          
          await initializePlayer()
          
          // 清除 URL 中的授權碼
          window.history.replaceState({}, document.title, window.location.pathname)
        } else {
          throw new Error('未收到 access token')
        }
      } catch (error) {
        console.error('❌ Token 交換失敗:', error)
        alert('獲取 Spotify token 失敗: ' + error.message)
      }
    }
  }

  // 初始化播放器
  const initializePlayer = async () => {
    try {
      console.log('🎮 初始化 Spotify 播放器...')
      
      // 載入 Spotify SDK
      await initializeSpotifySDK()
      
      spotifyPlayer.value = new window.Spotify.Player({
        name: 'DDM360 Web Player',
        getOAuthToken: (cb) => {
          cb(accessToken.value)
        },
        volume: volume.value / 100
      })

      // 播放器事件監聽
      spotifyPlayer.value.addListener('ready', ({ device_id }) => {
        console.log('✅ Spotify 播放器準備就緒，設備 ID:', device_id)
        deviceId.value = device_id
        isSpotifyConnected.value = true
        getDevices()
      })

      spotifyPlayer.value.addListener('not_ready', ({ device_id }) => {
        console.log('⚠️ 設備離線:', device_id)
        isSpotifyConnected.value = false
      })

      spotifyPlayer.value.addListener('player_state_changed', (state) => {
        if (!state) return

        console.log('🎵 播放狀態更新:', state)
        currentTrack.value = state.track_window.current_track
        isPlaying.value = !state.paused
        currentTime.value = Math.floor(state.position / 1000)
        duration.value = Math.floor(state.duration / 1000)
        isShuffled.value = state.shuffle
        
        const repeatStates = { 0: 'off', 1: 'context', 2: 'track' }
        repeatMode.value = repeatStates[state.repeat_mode] || 'off'
      })

      spotifyPlayer.value.addListener('initialization_error', ({ message }) => {
        console.error('❌ 播放器初始化失敗:', message)
        alert('播放器初始化失敗: ' + message)
      })

      spotifyPlayer.value.addListener('authentication_error', ({ message }) => {
        console.error('❌ 播放器認證失敗:', message)
        alert('播放器認證失敗，請重新登入')
        disconnectSpotify()
      })

      spotifyPlayer.value.addListener('account_error', ({ message }) => {
        console.error('❌ 帳戶錯誤:', message)
        alert('需要 Spotify Premium 帳戶才能使用播放功能')
      })

      // 連接播放器
      const success = await spotifyPlayer.value.connect()
      if (success) {
        console.log('✅ 播放器連接成功')
      } else {
        throw new Error('播放器連接失敗')
      }
      
    } catch (error) {
      console.error('❌ 初始化播放器失敗:', error)
      alert('初始化 Spotify 播放器失敗: ' + error.message)
    }
  }

  // Spotify API 請求包裝
  const spotifyAPI = async (endpoint, options = {}) => {
    const url = `https://api.spotify.com/v1${endpoint}`
    const headers = {
      'Authorization': `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      if (response.status === 401) {
        console.log('🔄 Token 可能已過期，嘗試刷新...')
        await refreshToken()
        // 重試請求
        return spotifyAPI(endpoint, options)
      }

      if (!response.ok) {
        throw new Error(`Spotify API 錯誤: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Spotify API 請求失敗:', error)
      throw error
    }
  }

  // 刷新 token
  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('spotify_refresh_token')
    if (!refreshTokenValue) {
      console.log('❌ 沒有 refresh token，需要重新授權')
      disconnectSpotify()
      return
    }

    try {
      const response = await fetch('/api/spotify/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue })
      })

      if (!response.ok) {
        throw new Error('刷新請求失敗')
      }

      const data = await response.json()
      if (data.access_token) {
        console.log('✅ Token 刷新成功')
        accessToken.value = data.access_token
        localStorage.setItem('spotify_access_token', data.access_token)
        
        if (data.refresh_token) {
          localStorage.setItem('spotify_refresh_token', data.refresh_token)
        }
      } else {
        throw new Error('未收到新的 access token')
      }
    } catch (error) {
      console.error('❌ 刷新 token 失敗:', error)
      disconnectSpotify()
    }
  }

  // 🎵 播放控制
  const playTrack = async (track) => {
    try {
      console.log('🎵 播放歌曲:', track.name)
      
      const uris = track.uri ? [track.uri] : [`spotify:track:${track.id}`]
      
      await spotifyAPI('/me/player/play', {
        method: 'PUT',
        body: JSON.stringify({
          device_id: deviceId.value,
          uris: uris
        })
      })
    } catch (error) {
      console.error('❌ 播放失敗:', error)
      alert('播放失敗: ' + error.message)
    }
  }

  const togglePlay = async () => {
    try {
      if (isPlaying.value) {
        await spotifyAPI('/me/player/pause', { method: 'PUT' })
      } else {
        await spotifyAPI('/me/player/play', { method: 'PUT' })
      }
    } catch (error) {
      console.error('❌ 切換播放狀態失敗:', error)
    }
  }

  const previousTrack = async () => {
    try {
      await spotifyAPI('/me/player/previous', { method: 'POST' })
    } catch (error) {
      console.error('❌ 上一首失敗:', error)
    }
  }

  const nextTrack = async () => {
    try {
      await spotifyAPI('/me/player/next', { method: 'POST' })
    } catch (error) {
      console.error('❌ 下一首失敗:', error)
    }
  }

  const seek = async (positionMs) => {
    try {
      await spotifyAPI(`/me/player/seek?position_ms=${positionMs}`, { method: 'PUT' })
    } catch (error) {
      console.error('❌ 跳轉失敗:', error)
    }
  }

  const setVolume = async (volumePercent = null) => {
    try {
      const newVolume = volumePercent !== null ? volumePercent : (volume.value + 10) % 110
      volume.value = newVolume
      await spotifyAPI(`/me/player/volume?volume_percent=${newVolume}`, { method: 'PUT' })
    } catch (error) {
      console.error('❌ 設置音量失敗:', error)
    }
  }

  const toggleShuffle = async () => {
    try {
      const newShuffleState = !isShuffled.value
      await spotifyAPI(`/me/player/shuffle?state=${newShuffleState}`, { method: 'PUT' })
    } catch (error) {
      console.error('❌ 切換隨機播放失敗:', error)
    }
  }

  const toggleRepeat = async () => {
    try {
      const modes = ['off', 'context', 'track']
      const currentIndex = modes.indexOf(repeatMode.value)
      const nextMode = modes[(currentIndex + 1) % modes.length]
      
      await spotifyAPI(`/me/player/repeat?state=${nextMode}`, { method: 'PUT' })
    } catch (error) {
      console.error('❌ 切換重複模式失敗:', error)
    }
  }

  // 🔍 搜尋功能
  const searchTracks = async (query, type = 'track') => {
    try {
      const params = new URLSearchParams({
        q: query,
        type: type,
        limit: 50
      })

      const data = await spotifyAPI(`/search?${params}`)
      return data.tracks?.items || []
    } catch (error) {
      console.error('❌ 搜尋失敗:', error)
      return []
    }
  }

  // 獲取推薦
  const getRecommendations = async () => {
    try {
      const data = await spotifyAPI('/recommendations?seed_genres=pop,rock,hip-hop&limit=20')
      return data.tracks || []
    } catch (error) {
      console.error('❌ 獲取推薦失敗:', error)
      return []
    }
  }

  // 獲取用戶播放清單
  const getUserPlaylists = async () => {
    try {
      const data = await spotifyAPI('/me/playlists?limit=50')
      return data.items || []
    } catch (error) {
      console.error('❌ 獲取播放清單失敗:', error)
      return []
    }
  }

  // 獲取設備
  const getDevices = async () => {
    try {
      const data = await spotifyAPI('/me/player/devices')
      spotifyDevices.value = data.devices || []
      return spotifyDevices.value
    } catch (error) {
      console.error('❌ 獲取設備失敗:', error)
      return []
    }
  }

  // 生命週期
  onMounted(async () => {
    console.log('🚀 useSpotify 組件已掛載 (真實模式)')
    
    if (!checkConfig()) {
      console.log('💡 提示：請設置 VITE_SPOTIFY_CLIENT_ID 以啟用 Spotify 功能')
      return
    }
    
    // 檢查 URL 中是否有授權回調
    if (window.location.search.includes('code=')) {
      await handleAuthCallback()
    } else {
      // 檢查本地存儲的 token
      const storedToken = localStorage.getItem('spotify_access_token')
      if (storedToken) {
        console.log('📱 發現本地 token，嘗試連接...')
        const isValid = await validateToken(storedToken)
        if (isValid) {
          accessToken.value = storedToken
          await initializePlayer()
        } else {
          localStorage.removeItem('spotify_access_token')
          localStorage.removeItem('spotify_refresh_token')
        }
      }
    }
  })

  onUnmounted(() => {
    if (spotifyPlayer.value) {
      spotifyPlayer.value.disconnect()
    }
  })

  return {
    // 狀態
    isSpotifyConnected,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    spotifyDevices,

    // 方法
    connectSpotify,
    disconnectSpotify,
    playTrack,
    togglePlay,
    previousTrack,
    nextTrack,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    searchTracks,
    getRecommendations,
    getUserPlaylists,
    getDevices
  }
}