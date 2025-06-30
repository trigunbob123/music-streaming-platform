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
  
  // 🆕 播放列表管理
  const currentPlaylist = ref([])
  const currentTrackIndex = ref(0)
  const autoPlayNext = ref(true) // 是否自動播放下一首
  
  // 設備列表
  const spotifyDevices = ref([])
  
  // 🆕 播放完畢檢測
  let lastPosition = 0
  let trackEndTimer = null
  let lastTrackId = ''
  
  // Spotify 配置
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000'
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
      console.warn('⚠️ 未設置 VITE_SPOTIFY_CLIENT_ID，Spotify 功能將被禁用')
      return false
    }
    console.log('✅ Spotify 配置檢查通過')
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

      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('✅ Spotify Web SDK 已準備就緒')
        resolve()
      }

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

  // 🆕 改進的歌曲結束檢測
  const checkTrackEnd = (state) => {
    const position = state.position
    const duration = state.duration
    const isCurrentlyPlaying = !state.paused
    const currentTrackId = state.track_window?.current_track?.id
    
    // 清除之前的計時器
    if (trackEndTimer) {
      clearTimeout(trackEndTimer)
      trackEndTimer = null
    }
    
    // 檢查是否為新歌曲
    if (currentTrackId && currentTrackId !== lastTrackId) {
      console.log('🎵 檢測到新歌曲:', state.track_window.current_track.name)
      lastTrackId = currentTrackId
      lastPosition = 0
    }
    
    // 方法1: 檢測歌曲接近結束
    if (isCurrentlyPlaying && duration > 30000 && (duration - position) <= 2000) {
      console.log('🎵 歌曲即將結束，準備播放下一首...')
      
      const remainingTime = Math.max(100, duration - position) // 至少等待100ms
      trackEndTimer = setTimeout(() => {
        if (autoPlayNext.value) {
          console.log('⏰ 計時器觸發，播放下一首')
          handleTrackEnd()
        }
      }, remainingTime)
    }
    
    // 方法2: 檢測歌曲停止且位置重置（歌曲結束的另一個信號）
    if (!isCurrentlyPlaying && lastPosition > 10000 && position < 5000) {
      console.log('🎵 檢測到歌曲可能已結束 (停止 + 位置重置)')
      if (autoPlayNext.value) {
        // 延遲一下再執行，確保狀態穩定
        setTimeout(() => {
          handleTrackEnd()
        }, 500)
      }
    }
    
    // 方法3: 檢測播放進度卡住不動（可能是歌曲結束）
    if (isCurrentlyPlaying && duration > 0 && Math.abs(position - lastPosition) < 100 && position > duration - 5000) {
      console.log('🎵 檢測到播放進度卡住，可能歌曲已結束')
      if (autoPlayNext.value) {
        setTimeout(() => {
          handleTrackEnd()
        }, 1000)
      }
    }
    
    lastPosition = position
  }

  // 🆕 處理歌曲結束
  const handleTrackEnd = async () => {
    console.log('🎵 處理歌曲結束，嘗試播放下一首...')
    
    try {
      // 如果有播放列表，播放下一首
      if (currentPlaylist.value.length > 0) {
        console.log('📋 使用本地播放列表播放下一首')
        await playNextInPlaylist()
      } else {
        // 如果沒有播放列表，嘗試讓 Spotify 自動播放下一首
        console.log('🎵 沒有本地播放列表，嘗試 Spotify 內建下一首功能')
        await nextTrack()
      }
    } catch (error) {
      console.error('❌ 自動播放下一首失敗:', error)
    }
  }

  // 🆕 播放播放列表中的下一首
  const playNextInPlaylist = async () => {
    if (currentPlaylist.value.length === 0) {
      console.log('❌ 播放列表為空，無法播放下一首')
      return false
    }
    
    let nextIndex = currentTrackIndex.value + 1
    
    // 處理重複模式
    if (repeatMode.value === 'track') {
      // 重複當前歌曲
      nextIndex = currentTrackIndex.value
      console.log('🔁 重複模式：重複當前歌曲')
    } else if (nextIndex >= currentPlaylist.value.length) {
      if (repeatMode.value === 'context') {
        // 重複播放列表
        nextIndex = 0
        console.log('🔁 重複模式：重複播放列表')
      } else {
        // 播放列表結束
        console.log('✅ 播放列表已結束')
        return false
      }
    }
    
    // 處理隨機播放
    if (isShuffled.value && repeatMode.value !== 'track') {
      nextIndex = Math.floor(Math.random() * currentPlaylist.value.length)
      console.log('🔀 隨機播放：選擇隨機歌曲', nextIndex)
    }
    
    currentTrackIndex.value = nextIndex
    const nextTrackToPlay = currentPlaylist.value[nextIndex]
    
    console.log(`🎵 播放下一首: ${nextTrackToPlay.name} (${nextIndex + 1}/${currentPlaylist.value.length})`)
    
    // 添加延遲避免API請求衝突
    await new Promise(resolve => setTimeout(resolve, 500))
    await playTrack(nextTrackToPlay)
    
    return true
  }

  // 🆕 設置播放列表
  const setPlaylist = (tracks, startIndex = 0) => {
    currentPlaylist.value = tracks
    currentTrackIndex.value = startIndex
    console.log('📋 設置播放列表:', tracks.length, '首歌曲，起始索引:', startIndex)
  }

  // 🆕 清除播放列表
  const clearPlaylist = () => {
    currentPlaylist.value = []
    currentTrackIndex.value = 0
    console.log('📋 清除播放列表')
  }

  // 連接 Spotify
  const connectSpotify = async () => {
    console.log('🎵 開始連接 Spotify...')
    
    if (!checkConfig()) {
      console.warn('⚠️ Spotify 配置不完整，無法連接')
      return
    }

    try {
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
    
    // 清除計時器
    if (trackEndTimer) {
      clearTimeout(trackEndTimer)
      trackEndTimer = null
    }
    
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    
    isSpotifyConnected.value = false
    spotifyPlayer.value = null
    currentTrack.value = {}
    isPlaying.value = false
    accessToken.value = ''
    clearPlaylist()
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
      })

      // 🆕 改進的播放狀態監聽
      spotifyPlayer.value.addListener('player_state_changed', (state) => {
        if (!state) return

        console.log('🎵 播放狀態更新:', {
          track: state.track_window?.current_track?.name,
          position: Math.floor(state.position / 1000),
          duration: Math.floor(state.duration / 1000),
          paused: state.paused
        })
        
        // 更新基本狀態
        currentTrack.value = state.track_window.current_track
        isPlaying.value = !state.paused
        currentTime.value = Math.floor(state.position / 1000)
        duration.value = Math.floor(state.duration / 1000)
        isShuffled.value = state.shuffle
        
        const repeatStates = { 0: 'off', 1: 'context', 2: 'track' }
        repeatMode.value = repeatStates[state.repeat_mode] || 'off'
        
        // 🆕 檢測歌曲結束
        checkTrackEnd(state)
        
        // 🆕 同步播放列表中的當前歌曲
        if (currentPlaylist.value.length > 0) {
          const currentTrackId = state.track_window.current_track?.id
          const playlistIndex = currentPlaylist.value.findIndex(track => track.id === currentTrackId)
          if (playlistIndex !== -1 && playlistIndex !== currentTrackIndex.value) {
            currentTrackIndex.value = playlistIndex
            console.log('🎵 同步播放列表索引:', playlistIndex)
          }
        }
      })

      spotifyPlayer.value.addListener('initialization_error', ({ message }) => {
        console.error('❌ 播放器初始化失敗:', message)
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

  // 🔧 改進的 Spotify API 請求包裝（添加重試和速率限制處理）
  const spotifyAPI = async (endpoint, options = {}, retryCount = 0) => {
    const MAX_RETRIES = 3
    const url = `https://api.spotify.com/v1${endpoint}`
    const headers = {
      'Authorization': `Bearer ${accessToken.value}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      console.log('🔄 發送 Spotify API 請求:', endpoint, retryCount > 0 ? `(重試 ${retryCount})` : '')
      
      const response = await fetch(url, {
        ...options,
        headers
      })

      console.log('📨 API 響應狀態:', response.status, response.statusText)

      // 處理 429 Too Many Requests（速率限制）
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '1'
        const waitTime = Math.min(parseInt(retryAfter) * 1000, 10000) // 最多等待10秒
        
        console.log(`⏳ API 速率限制，等待 ${waitTime}ms 後重試...`)
        
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return spotifyAPI(endpoint, options, retryCount + 1)
        } else {
          throw new Error('API 請求速率限制，請稍後再試')
        }
      }

      // 處理 503 Service Unavailable（服務器錯誤）
      if (response.status === 503) {
        console.log('⚠️ Spotify 服務暫時不可用')
        
        if (retryCount < MAX_RETRIES) {
          const waitTime = Math.pow(2, retryCount) * 1000 // 指數退避：1s, 2s, 4s
          console.log(`⏳ 等待 ${waitTime}ms 後重試...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return spotifyAPI(endpoint, options, retryCount + 1)
        } else {
          throw new Error('Spotify 服務暫時不可用，請稍後再試')
        }
      }

      if (response.status === 401) {
        console.log('🔄 Token 可能已過期，嘗試刷新...')
        await refreshToken()
        // 重試請求（只重試一次避免無限循環）
        if (retryCount === 0) {
          return spotifyAPI(endpoint, options, 1)
        } else {
          throw new Error('認證失敗，請重新登入')
        }
      }

      if (response.status === 404) {
        throw new Error('未找到活躍的播放設備。請確保你的 Spotify 應用正在運行並播放音樂。')
      }

      if (response.status === 403) {
        throw new Error('操作被禁止。請確保你有 Spotify Premium 帳戶。')
      }

      if (!response.ok) {
        // 嘗試讀取錯誤響應
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message
          }
        } catch (parseError) {
          console.log('⚠️ 無法解析錯誤響應 JSON')
        }
        throw new Error(errorMessage)
      }

      // 🔧 修正：檢查響應是否有內容
      const contentLength = response.headers.get('content-length')
      const contentType = response.headers.get('content-type')
      
      // 如果是 PUT/POST 請求且返回 204 No Content，直接返回成功
      if (response.status === 204 || contentLength === '0') {
        console.log('✅ 操作成功 (無響應內容)')
        return { success: true }
      }

      // 只有當有內容且是 JSON 時才嘗試解析
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json()
          console.log('✅ JSON 解析成功')
          return data
        } catch (jsonError) {
          console.error('❌ JSON 解析失敗:', jsonError)
          // 如果 JSON 解析失敗但狀態碼是成功的，說明操作可能成功了
          if (response.ok) {
            console.log('✅ 操作可能成功 (JSON 解析失敗但狀態碼正常)')
            return { success: true }
          }
          throw new Error('響應格式錯誤')
        }
      } else {
        // 非 JSON 響應
        const text = await response.text()
        console.log('📝 非 JSON 響應:', text)
        return { success: true, data: text }
      }

    } catch (error) {
      console.error('❌ Spotify API 請求失敗:', error)
      
      // 如果是網路錯誤且還有重試次數，則重試
      if ((error.name === 'TypeError' || error.message.includes('fetch')) && retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount) * 1000
        console.log(`🔄 網路錯誤，${waitTime}ms 後重試...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return spotifyAPI(endpoint, options, retryCount + 1)
      }
      
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

  // 🎵 改進的播放控制（添加重試和更好的錯誤處理）
  const playTrack = async (track, playlistTracks = null, trackIndex = 0) => {
    try {
      console.log('🎵 嘗試播放歌曲:', track.name)
      
      // 如果提供了播放列表，設置它
      if (playlistTracks) {
        setPlaylist(playlistTracks, trackIndex)
      }
      
      const uris = track.uri ? [track.uri] : [`spotify:track:${track.id}`]
      
      // 添加小延遲以避免連續 API 請求
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const result = await spotifyAPI('/me/player/play', {
        method: 'PUT',
        body: JSON.stringify({
          uris: uris
        })
      })
      
      console.log('✅ 播放請求成功')
      
    } catch (error) {
      console.error('❌ 播放失敗:', error)
      
      // 提供更友好的錯誤信息
      let userMessage = error.message
      
      if (error.message.includes('429')) {
        userMessage = 'API 請求過於頻繁，請稍等片刻再試'
      } else if (error.message.includes('404')) {
        userMessage = '請先在 Spotify 手機或桌面應用中開始播放任何歌曲，然後再試一次'
      } else if (error.message.includes('403')) {
        userMessage = '需要 Spotify Premium 帳戶才能播放音樂'
      } else if (error.message.includes('503')) {
        userMessage = 'Spotify 服務暫時不可用，請稍後再試'
      } else if (error.message.includes('Server error')) {
        userMessage = 'Spotify 伺服器暫時繁忙，請稍後再試'
      }
      
      // 只對嚴重錯誤顯示 alert，對速率限制等問題則靜默處理
      if (!error.message.includes('429') && !error.message.includes('503')) {
        alert('播放失敗: ' + userMessage)
      } else {
        console.warn('⚠️ 播放請求被限制，將自動重試')
      }
    }
  }

  const togglePlay = async () => {
    try {
      if (isPlaying.value) {
        await spotifyAPI('/me/player/pause', { method: 'PUT' })
        console.log('⏸️ 暫停播放')
      } else {
        await spotifyAPI('/me/player/play', { method: 'PUT' })
        console.log('▶️ 恢復播放')
      }
    } catch (error) {
      console.error('❌ 切換播放狀態失敗:', error)
      alert('操作失敗: 請確保 Spotify 正在運行並播放音樂')
    }
  }

  const previousTrack = async () => {
    try {
      // 如果有本地播放列表，使用本地邏輯
      if (currentPlaylist.value.length > 0) {
        let prevIndex = currentTrackIndex.value - 1
        if (prevIndex < 0) {
          prevIndex = repeatMode.value === 'context' ? currentPlaylist.value.length - 1 : 0
        }
        
        currentTrackIndex.value = prevIndex
        const prevTrack = currentPlaylist.value[prevIndex]
        await playTrack(prevTrack)
      } else {
        // 使用 Spotify API
        await spotifyAPI('/me/player/previous', { method: 'POST' })
      }
      console.log('⏮️ 上一首')
    } catch (error) {
      console.error('❌ 上一首失敗:', error)
    }
  }

  const nextTrack = async () => {
    try {
      // 如果有本地播放列表，使用本地邏輯
      if (currentPlaylist.value.length > 0) {
        await playNextInPlaylist()
      } else {
        // 使用 Spotify API
        await spotifyAPI('/me/player/next', { method: 'POST' })
      }
      console.log('⏭️ 下一首')
    } catch (error) {
      console.error('❌ 下一首失敗:', error)
    }
  }

  const seek = async (event) => {
    if (!duration.value) return
    
    try {
      const rect = event.currentTarget.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const progressPercent = clickX / rect.width
      const positionMs = Math.floor(progressPercent * duration.value * 1000)
      
      await spotifyAPI(`/me/player/seek?position_ms=${positionMs}`, { method: 'PUT' })
      console.log('🎯 跳轉到:', Math.floor(positionMs / 1000), '秒')
    } catch (error) {
      console.error('❌ 跳轉失敗:', error)
    }
  }

  // 🔧 改進的音量設置函數（添加節流和錯誤處理）
  let volumeTimeout = null
  const setVolume = async (volumePercent) => {
    try {
      // 確保 volumePercent 是數字
      let newVolume
      
      if (volumePercent !== undefined && volumePercent !== null) {
        // 如果傳入了具體數值，使用該數值
        newVolume = parseInt(volumePercent)
      } else {
        // 如果沒有傳入數值，增加音量
        newVolume = (volume.value + 25) % 125
        if (newVolume > 100) newVolume = 0
      }
      
      // 確保音量在有效範圍內
      newVolume = Math.max(0, Math.min(100, newVolume))
      
      console.log('🔊 設置音量為:', newVolume + '%')
      
      // 立即更新本地狀態以提供即時反饋
      volume.value = newVolume
      
      // 使用節流來避免過於頻繁的 API 請求
      if (volumeTimeout) {
        clearTimeout(volumeTimeout)
      }
      
      volumeTimeout = setTimeout(async () => {
        try {
          // 發送到 Spotify API（使用較低優先級，允許失敗）
          await spotifyAPI(`/me/player/volume?volume_percent=${newVolume}`, { method: 'PUT' })
          console.log('✅ 音量設置成功')
        } catch (error) {
          console.warn('⚠️ 音量設置 API 請求失敗（但本地音量已更新）:', error.message)
          // 不顯示錯誤 alert，因為這會干擾用戶體驗
          // 本地音量狀態已經更新，用戶可以繼續使用
        }
      }, 500) // 延遲 500ms 發送請求，避免過於頻繁
      
    } catch (error) {
      console.error('❌ 設置音量失敗:', error)
      // 不要顯示音量錯誤的 alert，因為這會干擾用戶體驗
    }
  }

  const toggleShuffle = async () => {
    try {
      const newShuffleState = !isShuffled.value
      await spotifyAPI(`/me/player/shuffle?state=${newShuffleState}`, { method: 'PUT' })
      console.log('🔀 隨機播放:', newShuffleState ? '開啟' : '關閉')
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
      console.log('🔁 重複模式:', nextMode)
    } catch (error) {
      console.error('❌ 切換重複模式失敗:', error)
    }
  }

  // 🔍 搜尋功能
  const searchTracks = async (query, type = 'track') => {
    try {
      if (!query.trim()) return []
      
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
      const data = await spotifyAPI('/recommendations?seed_genres=pop&limit=20')
      return data.tracks || []
    } catch (error) {
      console.error('❌ 獲取推薦失敗:', error)
      try {
        const fallbackData = await spotifyAPI('/search?q=year:2024&type=track&limit=20')
        return fallbackData.tracks?.items || []
      } catch (fallbackError) {
        console.error('❌ 備用搜尋也失敗:', fallbackError)
        return []
      }
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
      
      console.log('🎮 可用設備:', spotifyDevices.value.map(d => ({ name: d.name, id: d.id, is_active: d.is_active })))
      
      return spotifyDevices.value
    } catch (error) {
      console.error('❌ 獲取設備失敗:', error)
      return []
    }
  }

  // 生命週期
  onMounted(async () => {
    console.log('🚀 useSpotify 組件已掛載')
    
    if (!checkConfig()) {
      console.log('💡 提示：Spotify 功能已禁用，需要正確的配置')
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
    
    // 清除計時器
    if (trackEndTimer) {
      clearTimeout(trackEndTimer)
      trackEndTimer = null
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
    
    // 🆕 新增的播放列表狀態
    currentPlaylist,
    currentTrackIndex,
    autoPlayNext,

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
    getDevices,
    
    // 🆕 新增的播放列表方法
    setPlaylist,
    clearPlaylist,
    playNextInPlaylist
  }
}