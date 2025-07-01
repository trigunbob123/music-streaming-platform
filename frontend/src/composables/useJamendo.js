
import { ref, onMounted, onUnmounted } from 'vue'

export function useJamendo() {
  // 基本配置
  const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  
  // 狀態管理
  const isJamendoConnected = ref(false)
  const audioPlayer = ref(null)
  const jamendoConfigured = ref(false)
  
  // 播放狀態
  const currentTrack = ref({})
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(50)
  const isShuffled = ref(false)
  const repeatMode = ref('off') // 'off', 'all', 'one'
  
  // 播放列表管理
  const currentPlaylist = ref([])
  const currentTrackIndex = ref(0)
  const autoPlayNext = ref(true)
  
  // 錯誤處理
  const lastError = ref('')
  
  // 🔧 新增：播放狀態鎖，防止競爭條件
  const isLoadingTrack = ref(false)
  const playPromise = ref(null)

  // 檢查配置
  const checkConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/jamendo/config/`)
      const config = await response.json()
      
      jamendoConfigured.value = config.available && config.status === 'configured'
      
      if (!jamendoConfigured.value) {
        console.warn('⚠️ Jamendo 未正確配置')
        return false
      }
      
      console.log('✅ Jamendo 配置檢查通過')
      return true
    } catch (error) {
      console.error('❌ Jamendo 配置檢查失敗:', error)
      jamendoConfigured.value = false
      return false
    }
  }

  // 🔧 改進的音頻播放器初始化
  const initializePlayer = () => {
    try {
      audioPlayer.value = new Audio()
      audioPlayer.value.volume = volume.value / 100
      audioPlayer.value.crossOrigin = "anonymous"
      audioPlayer.value.preload = "metadata"
      
      // 音頻事件監聽
      audioPlayer.value.addEventListener('loadstart', () => {
        console.log('🎵 開始載入音頻')
        isLoadingTrack.value = true
      })
      
      audioPlayer.value.addEventListener('canplay', () => {
        console.log('🎵 音頻可以播放')
        duration.value = Math.floor(audioPlayer.value.duration || 0)
        isLoadingTrack.value = false
      })
      
      audioPlayer.value.addEventListener('play', () => {
        console.log('▶️ 音頻開始播放')
        isPlaying.value = true
      })
      
      audioPlayer.value.addEventListener('pause', () => {
        console.log('⏸️ 音頻暫停')
        isPlaying.value = false
      })
      
      audioPlayer.value.addEventListener('timeupdate', () => {
        currentTime.value = Math.floor(audioPlayer.value.currentTime || 0)
      })
      
      audioPlayer.value.addEventListener('ended', () => {
        console.log('🎵 歌曲播放結束')
        isPlaying.value = false
        if (autoPlayNext.value) {
          handleTrackEnd()
        }
      })
      
      audioPlayer.value.addEventListener('error', (e) => {
        console.error('❌ 音頻播放錯誤:', e)
        lastError.value = '音頻載入失敗'
        isPlaying.value = false
        isLoadingTrack.value = false
      })
      
      // 🔧 新增：處理載入錯誤
      audioPlayer.value.addEventListener('stalled', () => {
        console.warn('⚠️ 音頻載入停滯')
        isLoadingTrack.value = false
      })
      
      audioPlayer.value.addEventListener('suspend', () => {
        console.log('⏸️ 音頻載入暫停')
        isLoadingTrack.value = false
      })
      
      console.log('✅ Jamendo 播放器初始化完成')
      
    } catch (error) {
      console.error('❌ 初始化播放器失敗:', error)
      lastError.value = '初始化播放器失敗'
    }
  }

  // API 請求封裝
  const jamendoAPI = async (endpoint, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const url = `${API_BASE}/api/jamendo/${endpoint}${queryString ? '?' + queryString : ''}`
      
      console.log('🔄 Jamendo API 請求:', endpoint, params)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // 檢查是否有錯誤
      if (data.error) {
        throw new Error(data.error)
      }
      
      console.log('✅ Jamendo API 響應:', data)
      return data
    } catch (error) {
      console.error('❌ Jamendo API 請求失敗:', error)
      lastError.value = error.message
      throw error
    }
  }

  // 搜尋音軌
  const searchTracks = async (query, options = {}) => {
    try {
      const params = {
        q: query,
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('search/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 搜尋失敗:', error)
      return []
    }
  }

  // 按標籤搜尋
  const getTracksByTag = async (tag, options = {}) => {
    try {
      const params = {
        tag: tag,
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('tracks/tag/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 按標籤搜尋失敗:', error)
      return []
    }
  }

  // 獲取熱門音軌
  const getPopularTracks = async (options = {}) => {
    try {
      const params = {
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('tracks/popular/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取熱門音軌失敗:', error)
      return []
    }
  }

  // 獲取最新音軌
  const getLatestTracks = async (options = {}) => {
    try {
      const params = {
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('tracks/latest/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取最新音軌失敗:', error)
      return []
    }
  }

  // 獲取隨機音軌
  const getRandomTracks = async (options = {}) => {
    try {
      const params = {
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('tracks/random/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取隨機音軌失敗:', error)
      return []
    }
  }

  // 🔧 改進的播放音軌函數 - 修復競爭條件
  const playTrack = async (track, playlistTracks = null, trackIndex = 0) => {
    try {
      console.log('🎵 準備播放:', track.name)
      
      if (!audioPlayer.value) {
        initializePlayer()
        // 等待播放器初始化
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // 🔧 防止重複載入相同歌曲
      if (currentTrack.value.id === track.id && !audioPlayer.value.ended) {
        console.log('🎵 歌曲已載入，直接播放')
        if (audioPlayer.value.paused) {
          await safePlay()
        }
        return
      }
      
      // 🔧 設置載入狀態
      isLoadingTrack.value = true
      lastError.value = ''
      
      // 設置播放列表
      if (playlistTracks) {
        setPlaylist(playlistTracks, trackIndex)
      }
      
      // 🔧 安全地停止當前播放
      await safePause()
      
      // 設置新的音軌
      currentTrack.value = track
      
      // 優先使用 audio 字段，如果沒有則使用 audiodownload
      const audioUrl = track.audio || track.audiodownload
      if (!audioUrl) {
        throw new Error('沒有可用的音頻 URL')
      }
      
      // 🔧 等待當前音頻完全停止後再設置新 URL
      audioPlayer.value.src = audioUrl
      
      // 🔧 等待音頻載入準備完成
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('音頻載入超時'))
        }, 10000) // 10秒超時
        
        const onCanPlay = () => {
          clearTimeout(timeout)
          audioPlayer.value.removeEventListener('canplay', onCanPlay)
          audioPlayer.value.removeEventListener('error', onError)
          resolve()
        }
        
        const onError = (e) => {
          clearTimeout(timeout)
          audioPlayer.value.removeEventListener('canplay', onCanPlay)
          audioPlayer.value.removeEventListener('error', onError)
          reject(new Error('音頻載入失敗'))
        }
        
        audioPlayer.value.addEventListener('canplay', onCanPlay, { once: true })
        audioPlayer.value.addEventListener('error', onError, { once: true })
        
        // 開始載入
        audioPlayer.value.load()
      })
      
      // 🔧 安全地開始播放
      await safePlay()
      
      console.log('✅ 開始播放:', track.name)
      
    } catch (error) {
      console.error('❌ 播放失敗:', error)
      lastError.value = '播放失敗: ' + error.message
      isLoadingTrack.value = false
      
      // 🔧 不要彈出 alert，只在控制台記錄錯誤
      console.warn('播放失敗，但不中斷用戶體驗')
    }
  }

  // 🔧 新增：安全的播放函數
  const safePlay = async () => {
    try {
      // 如果有未完成的播放 Promise，等待它完成
      if (playPromise.value) {
        await playPromise.value.catch(() => {})
      }
      
      // 確保音頻已暫停
      if (!audioPlayer.value.paused) {
        audioPlayer.value.pause()
        // 等待暫停完成
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // 開始新的播放
      playPromise.value = audioPlayer.value.play()
      await playPromise.value
      
      playPromise.value = null
      
    } catch (error) {
      playPromise.value = null
      
      // 🔧 靜默處理常見的播放中斷錯誤
      if (error.name === 'AbortError' || error.message.includes('interrupted')) {
        console.log('🔄 播放被中斷，這是正常的')
        return
      }
      
      throw error
    }
  }

  // 🔧 新增：安全的暫停函數
  const safePause = async () => {
    try {
      // 如果有未完成的播放 Promise，等待它完成
      if (playPromise.value) {
        await playPromise.value.catch(() => {})
        playPromise.value = null
      }
      
      // 暫停播放
      if (!audioPlayer.value.paused) {
        audioPlayer.value.pause()
      }
      
      // 等待暫停完成
      await new Promise(resolve => setTimeout(resolve, 50))
      
    } catch (error) {
      console.warn('暫停音頻時出錯:', error)
    }
  }

  // 🔧 改進的播放控制
  const togglePlay = async () => {
    try {
      if (!audioPlayer.value || !currentTrack.value.name) {
        console.warn('⚠️ 沒有可播放的音軌')
        return
      }
      
      if (isLoadingTrack.value) {
        console.log('⏳ 歌曲正在載入中，請稍候...')
        return
      }
      
      if (isPlaying.value) {
        await safePause()
      } else {
        await safePlay()
      }
    } catch (error) {
      console.error('❌ 切換播放狀態失敗:', error)
      lastError.value = '播放控制失敗'
    }
  }

  const previousTrack = async () => {
    try {
      if (currentPlaylist.value.length === 0) {
        console.warn('⚠️ 沒有播放列表')
        return
      }
      
      let prevIndex = currentTrackIndex.value - 1
      if (prevIndex < 0) {
        prevIndex = repeatMode.value === 'all' ? currentPlaylist.value.length - 1 : 0
      }
      
      currentTrackIndex.value = prevIndex
      const prevTrack = currentPlaylist.value[prevIndex]
      await playTrack(prevTrack)
      
    } catch (error) {
      console.error('❌ 上一首失敗:', error)
    }
  }

  const nextTrack = async () => {
    try {
      await playNextInPlaylist()
    } catch (error) {
      console.error('❌ 下一首失敗:', error)
    }
  }

  const seek = (event) => {
    if (!audioPlayer.value || !duration.value) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const progressPercent = clickX / rect.width
    const newTime = progressPercent * duration.value
    
    audioPlayer.value.currentTime = newTime
    currentTime.value = Math.floor(newTime)
  }

  const setVolume = (volumePercent) => {
    if (!audioPlayer.value) return
    
    const newVolume = Math.max(0, Math.min(100, parseInt(volumePercent)))
    volume.value = newVolume
    audioPlayer.value.volume = newVolume / 100
  }

  const toggleShuffle = () => {
    isShuffled.value = !isShuffled.value
    console.log('🔀 隨機播放:', isShuffled.value ? '開啟' : '關閉')
  }

  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one']
    const currentIndex = modes.indexOf(repeatMode.value)
    repeatMode.value = modes[(currentIndex + 1) % modes.length]
    console.log('🔁 重複模式:', repeatMode.value)
  }

  // 播放列表管理
  const setPlaylist = (tracks, startIndex = 0) => {
    currentPlaylist.value = tracks
    currentTrackIndex.value = startIndex
    console.log('📋 設置播放列表:', tracks.length, '首歌曲')
  }

  const clearPlaylist = () => {
    currentPlaylist.value = []
    currentTrackIndex.value = 0
    console.log('📋 清除播放列表')
  }

  const playNextInPlaylist = async () => {
    if (currentPlaylist.value.length === 0) return
    
    let nextIndex = currentTrackIndex.value + 1
    
    // 處理重複模式
    if (repeatMode.value === 'one') {
      nextIndex = currentTrackIndex.value
    } else if (nextIndex >= currentPlaylist.value.length) {
      if (repeatMode.value === 'all') {
        nextIndex = 0
      } else {
        console.log('🎵 播放列表已結束')
        return
      }
    }
    
    // 處理隨機播放
    if (isShuffled.value && repeatMode.value !== 'one') {
      nextIndex = Math.floor(Math.random() * currentPlaylist.value.length)
    }
    
    currentTrackIndex.value = nextIndex
    const nextTrack = currentPlaylist.value[nextIndex]
    
    console.log('🎵 播放下一首:', nextTrack.name)
    await playTrack(nextTrack)
  }

  const handleTrackEnd = async () => {
    console.log('🎵 歌曲結束，嘗試播放下一首...')
    
    try {
      if (currentPlaylist.value.length > 0) {
        await playNextInPlaylist()
      }
    } catch (error) {
      console.error('❌ 自動播放下一首失敗:', error)
    }
  }

  // 連接和斷開
  const connectJamendo = async () => {
    console.log('🎵 連接 Jamendo...')
    
    const configOk = await checkConfig()
    if (!configOk) {
      lastError.value = 'Jamendo 配置不正確'
      return false
    }
    
    try {
      initializePlayer()
      isJamendoConnected.value = true
      lastError.value = ''
      console.log('✅ Jamendo 連接成功')
      return true
    } catch (error) {
      console.error('❌ 連接失敗:', error)
      lastError.value = '連接失敗'
      return false
    }
  }

  const disconnectJamendo = () => {
    console.log('🔌 斷開 Jamendo 連接')
    
    if (audioPlayer.value) {
      audioPlayer.value.pause()
      audioPlayer.value.src = ''
    }
    
    isJamendoConnected.value = false
    currentTrack.value = {}
    isPlaying.value = false
    clearPlaylist()
    lastError.value = ''
    playPromise.value = null
    isLoadingTrack.value = false
  }

  // 健康檢查
  const healthCheck = async () => {
    try {
      const response = await jamendoAPI('health/')
      return response.status === 'healthy'
    } catch (error) {
      console.error('❌ 健康檢查失敗:', error)
      return false
    }
  }

  // 獲取可用標籤
  const getAvailableTags = async () => {
    try {
      const response = await jamendoAPI('tags/')
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取標籤失敗:', error)
      return ['pop', 'rock', 'electronic', 'jazz', 'classical', 'hiphop', 'metal', 'world', 'soundtrack', 'lounge']
    }
  }

  // 生命週期
  onMounted(async () => {
    console.log('🚀 useJamendo 組件已掛載')
    
    const configOk = await checkConfig()
    if (configOk) {
      // 自動連接
      await connectJamendo()
    } else {
      console.log('💡 提示：Jamendo 需要正確配置才能使用')
    }
  })

  onUnmounted(() => {
    disconnectJamendo()
  })

  return {
    // 狀態
    isJamendoConnected,
    jamendoConfigured,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    currentPlaylist,
    currentTrackIndex,
    autoPlayNext,
    lastError,
    isLoadingTrack, // 🔧 新增

    // 方法
    connectJamendo,
    disconnectJamendo,
    playTrack,
    togglePlay,
    previousTrack,
    nextTrack,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    searchTracks,
    getTracksByTag,
    getPopularTracks,
    getLatestTracks,
    getRandomTracks,
    setPlaylist,
    clearPlaylist,
    playNextInPlaylist,
    healthCheck,
    getAvailableTags
  }
}