// frontend/src/composables/useJamendo.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useJamendo() {
  // 基本配置
  const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID
  const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0'
  
  // 狀態管理
  const isJamendoConnected = ref(false)
  const audioPlayer = ref(null)
  
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
  
  // 檢查配置
  const checkConfig = () => {
    if (!JAMENDO_CLIENT_ID) {
      console.warn('⚠️ 未設置 VITE_JAMENDO_CLIENT_ID')
      return false
    }
    console.log('✅ Jamendo 配置檢查通過')
    return true
  }

  // 初始化音頻播放器
  const initializePlayer = () => {
    try {
      audioPlayer.value = new Audio()
      audioPlayer.value.volume = volume.value / 100
      
      // 音頻事件監聽
      audioPlayer.value.addEventListener('loadstart', () => {
        console.log('🎵 開始載入音頻')
      })
      
      audioPlayer.value.addEventListener('canplay', () => {
        console.log('🎵 音頻可以播放')
        duration.value = Math.floor(audioPlayer.value.duration || 0)
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
        isPlaying.value = false
      })
      
      isJamendoConnected.value = true
      console.log('✅ Jamendo 播放器初始化完成')
      
    } catch (error) {
      console.error('❌ 初始化播放器失敗:', error)
    }
  }

  // Jamendo API 請求封裝
  const jamendoAPI = async (endpoint, params = {}) => {
    try {
      const baseParams = {
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: 50,
        ...params
      }
      
      const queryString = new URLSearchParams(baseParams).toString()
      const url = `${JAMENDO_API_BASE}/${endpoint}?${queryString}`
      
      console.log('🔄 Jamendo API 請求:', endpoint, params)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Jamendo API 響應:', data)
      
      return data
    } catch (error) {
      console.error('❌ Jamendo API 請求失敗:', error)
      throw error
    }
  }

  // 搜尋音軌
  const searchTracks = async (query, options = {}) => {
    try {
      const params = {
        search: query,
        include: 'musicinfo',
        audioformat: 'mp32',
        ...options
      }
      
      const response = await jamendoAPI('tracks', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 搜尋失敗:', error)
      return []
    }
  }

  // 按標籤搜尋（相當於曲風）
  const getTracksByTag = async (tag, options = {}) => {
    try {
      const params = {
        tags: tag,
        include: 'musicinfo',
        audioformat: 'mp32',
        ...options
      }
      
      const response = await jamendoAPI('tracks', params)
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
        order: 'popularity_total',
        include: 'musicinfo',
        audioformat: 'mp32',
        ...options
      }
      
      const response = await jamendoAPI('tracks', params)
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
        order: 'releasedate_desc',
        include: 'musicinfo',
        audioformat: 'mp32',
        ...options
      }
      
      const response = await jamendoAPI('tracks', params)
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
        order: 'random',
        include: 'musicinfo',
        audioformat: 'mp32',
        ...options
      }
      
      const response = await jamendoAPI('tracks', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取隨機音軌失敗:', error)
      return []
    }
  }

  // 播放音軌
  const playTrack = async (track, playlistTracks = null, trackIndex = 0) => {
    try {
      console.log('🎵 準備播放:', track.name)
      
      if (!audioPlayer.value) {
        await initializePlayer()
      }
      
      // 設置播放列表
      if (playlistTracks) {
        setPlaylist(playlistTracks, trackIndex)
      }
      
      // 停止當前播放
      audioPlayer.value.pause()
      
      // 設置新的音軌
      currentTrack.value = track
      audioPlayer.value.src = track.audio || track.audiodownload
      
      // 開始播放
      await audioPlayer.value.play()
      
      console.log('✅ 開始播放:', track.name)
      
    } catch (error) {
      console.error('❌ 播放失敗:', error)
      alert('播放失敗: ' + error.message)
    }
  }

  // 播放控制
  const togglePlay = async () => {
    try {
      if (!audioPlayer.value) return
      
      if (isPlaying.value) {
        audioPlayer.value.pause()
      } else {
        await audioPlayer.value.play()
      }
    } catch (error) {
      console.error('❌ 切換播放狀態失敗:', error)
    }
  }

  const previousTrack = async () => {
    try {
      if (currentPlaylist.value.length === 0) return
      
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
    
    if (!checkConfig()) {
      alert('請先設置 VITE_JAMENDO_CLIENT_ID')
      return false
    }
    
    try {
      await initializePlayer()
      return true
    } catch (error) {
      console.error('❌ 連接失敗:', error)
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
  }

  // 生命週期
  onMounted(async () => {
    console.log('🚀 useJamendo 組件已掛載')
    
    if (checkConfig()) {
      await connectJamendo()
    }
  })

  onUnmounted(() => {
    disconnectJamendo()
  })

  return {
    // 狀態
    isJamendoConnected,
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
    playNextInPlaylist
  }
}