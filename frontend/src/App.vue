<template>
  <div class="app-container">
    <!-- 左側邊欄 -->
    <SideBar 
      :is-jamendo-connected="isJamendoConnected"
      :jamendo-configured="jamendoConfigured"
      :current-mode="currentMode"
      @connect-jamendo="connectJamendo"
      @set-mode="setCurrentMode"
    />

    <!-- 主要內容區域 - 動態背景 -->
    <div class="main-content" :class="currentThemeClass">
      <!-- 頂部播放器 -->
      <TopPlayer 
        :current-track="currentTrack"
        :is-playing="isPlaying"
        :is-loading-track="isLoadingTrack"
        :current-time="currentTime"
        :duration="duration"
        :volume="volume"
        :is-shuffled="isShuffled"
        :repeat-mode="repeatMode"
        :progress-percentage="progressPercentage"
        @toggle-play="handleTogglePlay"
        @previous-track="handlePreviousTrack"
        @next-track="handleNextTrack"
        @seek="handleSeek"
        @volume-change="handleVolumeChange"
        @toggle-shuffle="toggleShuffle"
        @toggle-repeat="toggleRepeat"
      />

      <!-- 搜尋欄和混和曲風播放清單控制 -->
      <div v-if="isJamendoConnected" class="p-2 pb-0 space-y-4">
        <!-- 搜尋欄 -->
        <SearchBar 
          v-model:search-query="searchQuery"
          @search="debouncedSearch"
        />

        <!-- 音樂播放清單控制 -->
        <PlaylistControl 
          :playlist-config="playlistConfig"
          :is-generating-playlist="isGeneratingPlaylist"
          :custom-playlist-status="customPlaylistStatus"
          :current-mode="currentMode"
          @start-custom-playlist="startCustomPlaylist"
        />
      </div>

      <!-- 主要內容 -->
      <div class="content-area">
        <!-- Jamendo 曲風按鈕 -->
        <GenreButtons 
          v-if="isJamendoConnected && currentMode !== 'favorites'"
          :jamendo-tags="jamendoTags"
          :selected-tag="selectedTag"
          @search-by-tag="searchByTag"
        />

        <!-- 我的收藏標題 -->
        <FavoriteHeader 
          v-if="currentMode === 'favorites'"
          :favorite-count="favoriteTrackIds.size"
        />

        <!-- 載入指示器 -->
        <LoadingIndicator v-if="loading" />

        <!-- 音樂卡片網格 -->
        <MusicGrid 
          :displayed-tracks="displayedTracks"
          :current-track="currentTrack"
          :is-playing="isPlaying"
          :is-loading-track="isLoadingTrack"
          :favorite-track-ids="favoriteTrackIds"
          :is-jamendo-connected="isJamendoConnected"
          :jamendo-configured="jamendoConfigured"
          :loading="loading"
          :current-mode="currentMode"
          @track-click="handleTrackClick"
          @toggle-favorite="toggleFavorite"
          @connect-jamendo="connectJamendo"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useJamendo } from './composables/useJamendo'

// 組件導入
import SideBar from './components/Sidebar.vue'
import TopPlayer from './components/TopPlayer.vue'
import SearchBar from './components/SearchBar.vue'
import PlaylistControl from './components/PlaylistControl.vue'
import GenreButtons from './components/GenreButtons.vue'
import FavoriteHeader from './components/FavoriteHeader.vue'
import LoadingIndicator from './components/LoadingIndicator.vue'
import MusicGrid from './components/MusicGrid.vue'

// Jamendo 組合式函數
let jamendoComposable = null

try {
  jamendoComposable = useJamendo()
} catch (error) {
  console.warn('useJamendo 初始化失敗:', error)
  // 創建空的替代對象
  jamendoComposable = {
    isJamendoConnected: ref(false),
    jamendoConfigured: ref(false),
    currentTrack: ref({}),
    isPlaying: ref(false),
    currentTime: ref(0),
    duration: ref(0),
    volume: ref(50),
    isShuffled: ref(false),
    repeatMode: ref('off'),
    currentPlaylist: ref([]),
    currentTrackIndex: ref(0),
    autoPlayNext: ref(true),
    lastError: ref(''),
    isLoadingTrack: ref(false),
    connectJamendo: () => Promise.resolve(),
    disconnectJamendo: () => {},
    playTrack: () => Promise.resolve(),
    togglePlay: () => Promise.resolve(),
    previousTrack: () => Promise.resolve(),
    nextTrack: () => Promise.resolve(),
    seek: () => Promise.resolve(),
    setVolume: () => Promise.resolve(),
    toggleShuffle: () => Promise.resolve(),
    toggleRepeat: () => Promise.resolve(),
    searchTracks: () => Promise.resolve([]),
    getTracksByTag: () => Promise.resolve([]),
    getPopularTracks: () => Promise.resolve([]),
    getLatestTracks: () => Promise.resolve([]),
    getRandomTracks: () => Promise.resolve([]),
    setPlaylist: () => {},
    clearPlaylist: () => {},
    playNextInPlaylist: () => Promise.resolve(),
    getAvailableTags: () => Promise.resolve([])
  }
}

const {
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
  isLoadingTrack,
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
  searchTracks: jamendoSearch,
  getTracksByTag,
  getPopularTracks,
  getLatestTracks,
  getRandomTracks,
  setPlaylist,
  clearPlaylist,
  playNextInPlaylist,
  getAvailableTags
} = jamendoComposable

// 基本數據
const currentMode = ref('popular')
const loading = ref(false)
const searchQuery = ref('')
const displayedTracks = ref([])

// 🆕 新增：當前選中的曲風主題
const currentTheme = ref('default')

// 收藏功能
const favoriteTrackIds = ref(new Set())
const favoriteTracks = ref([])

// 追蹤當前選中的標籤
const selectedTag = ref('')

// Jamendo API 官方推薦的10個曲風
const jamendoTags = ref([
  'pop', 'rock', 'electronic', 'jazz', 'classical',
  'hiphop', 'metal', 'world', 'soundtrack', 'lounge'
])

// 🆕 新增：自定義播放清單功能
const playlistConfig = ref([
  { genre: 'Jazz', count: 3 },
  { genre: 'Country', count: 5 },
  { genre: 'Rock', count: 1 }
])

const isGeneratingPlaylist = ref(false)

// 🆕 新增：自定義播放清單狀態追蹤
const customPlaylistStatus = ref({
  isActive: false,
  currentGroup: 1,
  currentGenre: 'Jazz',
  currentInGroup: 1,
  totalInGroup: 3,
  overallProgress: 1,
  totalTracks: 9,
  groupBreakpoints: [],
  originalConfig: []
})

// 可用的曲風選項
const availableGenres = [
  { label: 'Pop', value: 'pop' },
  { label: 'Rock', value: 'rock' },
  { label: 'Hip Hop', value: 'hiphop' },
  { label: 'Electronic', value: 'electronic' },
  { label: 'Jazz', value: 'jazz' },
  { label: 'Classical', value: 'classical' },
  { label: 'Metal', value: 'metal' },
  { label: 'Lounge', value: 'lounge' },
  { label: 'Soundtrack', value: 'soundtrack' },
  { label: 'World', value: 'world' }
]

// 🆕 新增：計算當前主題 CSS 類別
const currentThemeClass = computed(() => {
  return `theme-${currentTheme.value}`
})

// 搜尋防抖
let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchTracks()
  }, 500)
}

// 事件處理函數
const handlePreviousTrack = async () => {
  try {
    console.log('⏮️ 點擊上一首按鈕')
    if (isLoadingTrack.value) {
      console.log('⏳ 歌曲正在載入中，請稍候...')
      return
    }
    
    if (previousTrack && typeof previousTrack === 'function') {
      await previousTrack()
    } else {
      console.warn('previousTrack 函數不可用')
    }
  } catch (error) {
    console.error('❌ 上一首失敗:', error)
  }
}

const handleNextTrack = async () => {
  try {
    console.log('⏭️ 點擊下一首按鈕')
    if (isLoadingTrack.value) {
      console.log('⏳ 歌曲正在載入中，請稍候...')
      return
    }
    
    if (nextTrack && typeof nextTrack === 'function') {
      await nextTrack()
    } else {
      console.warn('nextTrack 函數不可用')
    }
  } catch (error) {
    console.error('❌ 下一首失敗:', error)
  }
}

const handleTogglePlay = async () => {
  try {
    console.log('⏯️ 點擊播放/暫停按鈕')
    
    if (!currentTrack.value.name) {
      console.warn('⚠️ 沒有可播放的音軌')
      return
    }
    
    if (togglePlay && typeof togglePlay === 'function') {
      await togglePlay()
    } else {
      console.warn('togglePlay 函數不可用')
    }
  } catch (error) {
    console.error('❌ 播放/暫停失敗:', error)
  }
}

let isClickProcessing = false
const handleTrackClick = async (track) => {
  try {
    if (isClickProcessing || isLoadingTrack.value) {
      console.log('⏳ 正在處理中，請稍候...')
      return
    }
    
    isClickProcessing = true
    console.log('🎵 點擊歌曲:', track.name)
    
    if (playTrack && typeof playTrack === 'function') {
      await playTrack(track)
    } else {
      console.warn('playTrack 函數不可用')
    }
  } catch (error) {
    console.error('❌ 播放歌曲失敗:', error)
  } finally {
    isClickProcessing = false
  }
}

// 收藏功能方法
const toggleFavorite = (track) => {
  if (favoriteTrackIds.value.has(track.id)) {
    favoriteTrackIds.value.delete(track.id)
    favoriteTracks.value = favoriteTracks.value.filter(t => t.id !== track.id)
  } else {
    favoriteTrackIds.value.add(track.id)
    favoriteTracks.value.push(track)
  }
  
  if (currentMode.value === 'favorites') {
    displayedTracks.value = [...favoriteTracks.value]
  }
  
  saveFavoritesToStorage()
}

const saveFavoritesToStorage = () => {
  try {
    localStorage.setItem('favorite_tracks', JSON.stringify(favoriteTracks.value))
    localStorage.setItem('favorite_track_ids', JSON.stringify([...favoriteTrackIds.value]))
  } catch (error) {
    console.error('保存收藏失敗:', error)
  }
}

const loadFavoritesFromStorage = () => {
  try {
    const savedTracks = localStorage.getItem('favorite_tracks')
    const savedIds = localStorage.getItem('favorite_track_ids')
    
    if (savedTracks) {
      favoriteTracks.value = JSON.parse(savedTracks)
    }
    
    if (savedIds) {
      favoriteTrackIds.value = new Set(JSON.parse(savedIds))
    }
  } catch (error) {
    console.error('載入收藏失敗:', error)
  }
}

// 音量控制方法
const handleVolumeChange = (event) => {
  const newVolume = parseInt(event.target.value)
  if (setVolume && typeof setVolume === 'function') {
    setVolume(newVolume)
  }
}

// 搜尋功能
const searchTracks = async () => {
  if (!searchQuery.value.trim() || !isJamendoConnected.value) return
  
  loading.value = true
  selectedTag.value = ''
  currentTheme.value = 'search' // 🆕 搜尋時的主題
  
  try {
    if (jamendoSearch && typeof jamendoSearch === 'function') {
      const results = await jamendoSearch(searchQuery.value, { limit: 30 })
      displayedTracks.value = results
    }
  } catch (error) {
    console.error('搜尋失敗:', error)
  } finally {
    loading.value = false
  }
}

// 進度條點擊處理
const handleSeek = (event) => {
  if (!duration.value || !seek || typeof seek !== 'function') return
  seek(event)
}

// 🆕 修改：按標籤搜尋 - 加入主題變更
const searchByTag = async (tag) => {
  selectedTag.value = tag
  searchQuery.value = ''
  currentTheme.value = tag // 🆕 設定當前主題為選中的曲風
  
  loading.value = true
  try {
    if (getTracksByTag && typeof getTracksByTag === 'function') {
      const results = await getTracksByTag(tag, { limit: 30 })
      displayedTracks.value = results
      console.log(`🎵 搜尋 ${tag} 曲風，找到 ${results.length} 首歌曲，主題切換為 ${tag}`)
    }
  } catch (error) {
    console.error('標籤搜尋失敗:', error)
  } finally {
    loading.value = false
  }
}

// 🆕 修改：設置模式 - 加入主題變更
const setCurrentMode = async (mode) => {
  currentMode.value = mode
  selectedTag.value = ''
  searchQuery.value = ''
  currentTheme.value = mode // 🆕 根據模式設定主題
  
  if (mode === 'favorites') {
    displayedTracks.value = [...favoriteTracks.value]
    return
  }
  
  if (!isJamendoConnected.value) return

  loading.value = true
  
  try {
    let results = []
    
    switch (mode) {
      case 'popular':
        if (getPopularTracks && typeof getPopularTracks === 'function') {
          results = await getPopularTracks({ limit: 30 })
        }
        break
      case 'latest':
        if (getLatestTracks && typeof getLatestTracks === 'function') {
          results = await getLatestTracks({ limit: 30 })
        }
        break
      case 'random':
        if (getRandomTracks && typeof getRandomTracks === 'function') {
          results = await getRandomTracks({ limit: 30 })
        }
        break
    }
    
    displayedTracks.value = results
  } catch (error) {
    console.error('載入失敗:', error)
  } finally {
    loading.value = false
  }
}

// 自定義播放清單功能
const getTracksWithFallback = async (genreValue, genreLabel, count) => {
  try {
    console.log(`🎵 嘗試按標籤獲取 ${genreLabel} 歌曲...`)
    
    if (getTracksByTag && typeof getTracksByTag === 'function') {
      const tracks = await getTracksByTag(genreValue, { limit: Math.max(count, 15) })
      
      if (tracks && tracks.length > 0) {
        console.log(`✅ 按標籤找到 ${tracks.length} 首 ${genreLabel} 歌曲`)
        return tracks
      }
    }
    
    console.log(`⚠️ 按標籤搜尋 ${genreLabel} 失敗，嘗試文字搜尋...`)
    
    if (jamendoSearch && typeof jamendoSearch === 'function') {
      const searchResults = await jamendoSearch(genreLabel, { limit: Math.max(count, 15) })
      
      if (searchResults && searchResults.length > 0) {
        console.log(`✅ 搜尋找到 ${searchResults.length} 首 ${genreLabel} 相關歌曲`)
        return searchResults
      }
    }
    
    console.log(`⚠️ 搜尋 ${genreLabel} 也失敗，嘗試獲取熱門歌曲...`)
    
    if (getPopularTracks && typeof getPopularTracks === 'function') {
      const popularTracks = await getPopularTracks({ limit: Math.max(count, 10) })
      
      if (popularTracks && popularTracks.length > 0) {
        console.log(`✅ 使用熱門歌曲作為 ${genreLabel} 的備案`)
        return popularTracks
      }
    }
    
    console.error(`❌ 所有方案都失敗，無法獲取 ${genreLabel} 歌曲`)
    return []
    
  } catch (error) {
    console.error(`❌ 獲取 ${genreLabel} 歌曲時出錯:`, error)
    return []
  }
}

const startCustomPlaylist = async () => {
  try {
    isGeneratingPlaylist.value = true
    currentTheme.value = 'custom' // 🆕 自定義播放清單主題
    console.log('🎵 開始生成自定義播放清單...', playlistConfig.value)
    
    const customPlaylist = []
    const groupBreakpoints = []
    let currentIndex = 0
    
    customPlaylistStatus.value.originalConfig = [...playlistConfig.value]
    
    for (let i = 0; i < playlistConfig.value.length; i++) {
      const config = playlistConfig.value[i]
      const genreValue = availableGenres.find(g => g.label === config.genre)?.value || 'pop'
      
      console.log(`📋 獲取 ${config.genre} 的 ${config.count} 首歌...`)
      
      try {
        const tracks = await getTracksWithFallback(genreValue, config.genre, config.count)
        
        if (tracks.length > 0) {
          const validTracks = tracks.filter(track => {
            const hasValidUrl = track.audio || track.audiodownload
            const hasBasicInfo = track.name && track.artist_name
            return hasValidUrl && hasBasicInfo
          })
          
          const selectedTracks = validTracks.slice(0, config.count)
          
          if (selectedTracks.length > 0) {
            const groupStart = currentIndex
            const groupEnd = currentIndex + selectedTracks.length - 1
            
            groupBreakpoints.push({
              genre: config.genre,
              start: groupStart,
              end: groupEnd,
              count: selectedTracks.length
            })
            
            customPlaylist.push(...selectedTracks)
            currentIndex += selectedTracks.length
            
            console.log(`✅ 已添加 ${selectedTracks.length} 首 ${config.genre} 歌曲 (索引 ${groupStart}-${groupEnd})`)
          } else {
            console.warn(`⚠️ ${config.genre} 曲風沒有有效的歌曲`)
          }
        } else {
          console.warn(`⚠️ 沒有找到 ${config.genre} 曲風的歌曲`)
        }
      } catch (error) {
        console.error(`❌ 獲取 ${config.genre} 歌曲失敗:`, error)
        continue
      }
    }
    
    if (customPlaylist.length === 0) {
      console.warn('⚠️ 沒有找到任何歌曲')
      return
    }
    
    console.log(`🎉 播放清單生成完成，共 ${customPlaylist.length} 首歌曲`)
    console.log('📊 組別分佈:', groupBreakpoints)
    
    customPlaylistStatus.value.isActive = true
    customPlaylistStatus.value.groupBreakpoints = groupBreakpoints
    customPlaylistStatus.value.totalTracks = customPlaylist.length
    customPlaylistStatus.value.overallProgress = 1
    
    if (setPlaylist && typeof setPlaylist === 'function') {
      setPlaylist(customPlaylist, 0)
    }
    
    await playFirstAvailableTrack(customPlaylist)
    
    displayedTracks.value = customPlaylist
    currentMode.value = 'custom'
    
    updateCustomPlaylistStatus()
    
  } catch (error) {
    console.error('❌ 生成自定義播放清單失敗:', error)
  } finally {
    isGeneratingPlaylist.value = false
  }
}

const playFirstAvailableTrack = async (playlist) => {
  for (let i = 0; i < Math.min(playlist.length, 5); i++) {
    try {
      console.log(`🎵 嘗試播放第 ${i + 1} 首歌: ${playlist[i].name}`)
      
      if (playTrack && typeof playTrack === 'function') {
        await playTrack(playlist[i], playlist, i)
        console.log(`✅ 成功播放第 ${i + 1} 首歌`)
        return
      }
    } catch (playError) {
      console.error(`❌ 播放第 ${i + 1} 首歌失敗:`, playError)
      
      if (i < Math.min(playlist.length, 5) - 1) {
        console.log(`🔄 嘗試播放下一首...`)
        continue
      } else {
        console.error(`❌ 前 ${Math.min(playlist.length, 5)} 首歌都無法播放`)
        throw playError
      }
    }
  }
}

const updateCustomPlaylistStatus = () => {
  if (!customPlaylistStatus.value.isActive || currentPlaylist.value.length === 0) {
    return
  }
  
  const currentIndex = currentTrackIndex.value
  const breakpoints = customPlaylistStatus.value.groupBreakpoints
  
  let currentGroup = 1
  let currentInGroup = 1
  let totalInGroup = 1
  let currentGenre = 'Unknown'
  
  for (let i = 0; i < breakpoints.length; i++) {
    if (currentIndex >= breakpoints[i].start && currentIndex <= breakpoints[i].end) {
      currentGroup = i + 1
      currentInGroup = currentIndex - breakpoints[i].start + 1
      totalInGroup = breakpoints[i].end - breakpoints[i].start + 1
      currentGenre = breakpoints[i].genre
      break
    }
  }
  
  customPlaylistStatus.value.currentGroup = currentGroup
  customPlaylistStatus.value.currentGenre = currentGenre
  customPlaylistStatus.value.currentInGroup = currentInGroup
  customPlaylistStatus.value.totalInGroup = totalInGroup
  customPlaylistStatus.value.overallProgress = currentIndex + 1
  
  console.log('📊 播放清單狀態更新:', {
    group: `${currentGroup}/${breakpoints.length}`,
    inGroup: `${currentInGroup}/${totalInGroup}`,
    overall: `${currentIndex + 1}/${currentPlaylist.value.length}`,
    genre: currentGenre
  })
}

// 載入可用標籤
const loadAvailableTags = async () => {
  try {
    if (getAvailableTags && typeof getAvailableTags === 'function') {
      const tags = await getAvailableTags()
      if (tags.length > 0) {
        jamendoTags.value = tags
        console.log('✅ 已載入 Jamendo 官方曲風標籤:', tags)
      }
    }
  } catch (error) {
    console.warn('載入標籤失敗，使用默認標籤:', error)
  }
}

// 計算屬性
const progressPercentage = computed(() => {
  return duration.value ? (currentTime.value / duration.value) * 100 : 0
})

// 監聽播放索引變化
watch(currentTrackIndex, () => {
  if (customPlaylistStatus.value.isActive) {
    updateCustomPlaylistStatus()
  }
}, { immediate: false })

// 監聽模式變化
watch(currentMode, (newMode) => {
  if (newMode !== 'custom') {
    customPlaylistStatus.value.isActive = false
  }
}, { immediate: false })

// 監聽 Jamendo 連接狀態
watch(isJamendoConnected, async (connected) => {
  if (connected) {
    await loadAvailableTags()
    if (currentMode.value !== 'favorites') {
      await setCurrentMode('popular')
    }
  }
}, { immediate: false })

// 初始化
onMounted(async () => {
  loadFavoritesFromStorage()
  
  if (isJamendoConnected.value && currentMode.value !== 'favorites') {
    await setCurrentMode('popular')
  }
})

// 清理資源
onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
/* 🔧 修改：確保側邊欄與內容區域高度一致的佈局 */
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #f3f4f6;
  align-items: stretch; /* 讓子元素高度一致 */
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 確保主內容區域至少佔滿螢幕高度 */
  transition: background 0.8s ease-in-out; /* 🆕 背景變換動畫 */
}

.content-area {
  flex: 1;
  padding: 1.5rem;
  min-height: calc(100vh - 200px); /* 減去頂部播放器和其他固定元素的高度 */
}

/* 🆕 新增：不同曲風主題的漸層背景 */

/* 預設主題 */
.theme-default,
.theme-popular {
  background: linear-gradient(90deg, #eeeeee 0%, #17243e 100%);
}

/* POP 主題 - 鮮豔粉紅色 */
.theme-pop {
  background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
}

/* ROCK 主題 - 強烈橙紅色 */
.theme-rock {
  background: linear-gradient(90deg, #ff6b6b 0%, #ee5a24 50%, #ea2027 100%);
}

/* ELECTRONIC 主題 - 霓虹藍紫色 */
.theme-electronic {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

/* JAZZ 主題 - 優雅金黃色 */
.theme-jazz {
  background: linear-gradient(90deg, #f6d365 0%, #fda085 50%, #ff9068 100%);
}

/* CLASSICAL 主題 - 典雅紫色 */
.theme-classical {
  background: linear-gradient(90deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%);
}

/* HIP HOP 主題 - 都市金色 */
.theme-hiphop {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 50%, #4facfe 100%);
}

/* METAL 主題 - 深沉灰黑色 */
.theme-metal {
  background: linear-gradient(90deg, #434343 0%, #000000 50%, #434343 100%);
}

/* WORLD 主題 - 地球色彩 */
.theme-world {
  background: linear-gradient(90deg, #56ab2f 0%, #a8e6cf 50%, #88d8a3 100%);
}

/* SOUNDTRACK 主題 - 電影感藍色 */
.theme-soundtrack {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
}

/* LOUNGE 主題 - 放鬆紫粉色 */
.theme-lounge {
  background: linear-gradient(90deg, #ffecd2 0%, #fcb69f 50%, #ffecd2 100%);
}

/* 特殊模式主題 */
.theme-favorites {
  background: linear-gradient(90deg, #ff9a9e 0%, #f093fb 50%, #fad0c4 100%);
}

.theme-latest {
  background: linear-gradient(90deg, #a8edea 0%, #fed6e3 50%, #fad0c4 100%);
}

.theme-random {
  background: linear-gradient(90deg, #d299c2 0%, #fef9d7 50%, #667eea 100%);
}

.theme-search {
  background: linear-gradient(90deg, #89f7fe 0%, #66a6ff 50%, #89f7fe 100%);
}

.theme-custom {
  background: linear-gradient(90deg, #ff9068 0%, #fd746c 50%, #ff9068 100%);
}

/* 響應式設計 */
@media (max-width: 1280px) {
  .grid-cols-6 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .grid-cols-6 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .grid-cols-6 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .grid-cols-5 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  
  .app-container {
    flex-direction: column;
    align-items: normal;
  }
  
  .main-content {
    min-height: auto;
  }
  
  .content-area {
    min-height: auto;
  }
}
</style>