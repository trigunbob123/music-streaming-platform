<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 左側邊欄 -->
    <div class="w-64 sidebar text-white p-4">
      <div class="flex items-center justify-between mb-8">
        <img 
  src="@/assets/images/12.png" 
  alt="DDM360" 
  class="h-auto w-20 "
/>
        <div class="flex space-x-2">
          <button v-if="!isSpotifyConnected && spotifyConfigured" @click="connectSpotify" 
                  class="text-green-400 hover:text-green-300 text-sm">
            <font-awesome-icon :icon="['fab', 'spotify']" class="mr-1" />
            連接 Spotify
          </button>
          <button v-else-if="isSpotifyConnected" @click="disconnectSpotify" 
                  class="text-green-400 hover:text-green-300 text-sm">
            <font-awesome-icon :icon="['fab', 'spotify']" class="mr-1" />
            已連接
          </button>
          <span v-else class="text-gray-400 text-xs">
            Spotify 未配置
          </span>
        </div>
      </div>

      <nav class="space-y-4 mb-8">
        <button @click="setCurrentMode('random')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
                :class="{ 'bg-gray-700': currentMode === 'random' }">
          <font-awesome-icon icon="random" class="mr-3" />
          隨機播放
        </button>
        <button @click="setCurrentMode('latest')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
                :class="{ 'bg-gray-700': currentMode === 'latest' }">
          <font-awesome-icon icon="music" class="mr-3" />
          新歌
        </button>
        <button @click="setCurrentMode('trending')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
                :class="{ 'bg-gray-700': currentMode === 'trending' }">
          <font-awesome-icon icon="fire" class="mr-3" />
          熱門歌曲
        </button>
        <button @click="setCurrentMode('favorites')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
                :class="{ 'bg-gray-700': currentMode === 'favorites' }">
          <font-awesome-icon icon="heart" class="mr-3" />
          我的收藏
        </button>
      </nav>

      <!-- Spotify 播放器狀態 -->
      <div v-if="isSpotifyConnected" class="mt-auto">
        <div class="bg-green-900 p-3 rounded-lg">
          <div class="flex items-center text-green-300 text-sm">
            <font-awesome-icon :icon="['fab', 'spotify']" class="mr-2" />
            <span>Spotify 已連接</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要內容區域 -->
    <div class="flex-1 main-content">
      <!-- 頂部播放器 -->
      <div class="bg-gray-800 p-6 text-white">
        <div class="flex items-center justify-center space-x-4">
          <button @click="previousTrack" class="btn btn-circle bg-white text-gray-800 hover:bg-gray-200">
            <font-awesome-icon icon="step-backward" class="text-xl" />
          </button>
          <button @click="togglePlay" class="btn btn-circle bg-white text-gray-800 hover:bg-gray-200">
            <font-awesome-icon :icon="isPlaying ? 'pause' : 'play'" class="text-xl" />
          </button>
          <button @click="nextTrack" class="btn btn-circle bg-white text-gray-800 hover:bg-gray-200">
            <font-awesome-icon icon="step-forward" class="text-xl" />
          </button>
          
          <div class="flex items-center space-x-3 min-w-96">
            <span class="text-sm">{{ formatTime(currentTime) }}</span>
            <div class="flex-1 bg-gray-600 rounded-full h-2 cursor-pointer" @click="seek">
              <div class="progress-bar h-2 rounded-full" :style="{ width: progressPercentage + '%' }"></div>
            </div>
            <span class="text-sm">{{ formatTime(duration) }}</span>
          </div>
          
          <button @click="toggleShuffle" class="btn btn-circle bg-transparent text-white hover:bg-gray-700"
                  :class="{ 'text-green-400': isShuffled }">
            <font-awesome-icon icon="random" class="text-xl" />
          </button>
          <button @click="toggleRepeat" class="btn btn-circle bg-transparent text-white hover:bg-gray-700"
                  :class="{ 'text-green-400': repeatMode !== 'off' }">
            <font-awesome-icon :icon="repeatMode === 'track' ? 'redo' : 'repeat'" class="text-xl" />
          </button>
          
          <!-- 音量控制 -->
          <div class="flex items-center space-x-2">
            <button class="btn btn-circle bg-transparent text-white hover:bg-gray-700">
              <font-awesome-icon :icon="getVolumeIcon()" class="text-xl" />
            </button>
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model="volume" 
              @input="handleVolumeChange"
              class="volume-slider w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span class="text-xs text-gray-300 w-8">{{ volume }}%</span>
          </div>
        </div>

        <!-- 當前播放歌曲 -->
        <div class="flex items-center justify-center mt-4" v-if="currentTrack.name">
          <div class="w-12 h-12 rounded-lg mr-3 overflow-hidden">
            <img v-if="currentTrack.album?.images?.[0]?.url" 
                 :src="currentTrack.album.images[0].url" 
                 :alt="currentTrack.name" 
                 class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-gradient-to-br from-green-500 to-purple-600 flex items-center justify-center">
              <font-awesome-icon icon="music" class="text-white text-xl" />
            </div>
          </div>
          <div class="text-left">
            <p class="font-medium text-sm">{{ currentTrack.name }}</p>
            <p class="text-xs text-gray-300">{{ currentTrack.artists?.map(a => a.name).join(', ') }}</p>
          </div>
        </div>

        <!-- 連接狀態 -->
        <div class="text-center mt-2">
          <span v-if="!isSpotifyConnected && spotifyConfigured" class="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800">
            未連接 Spotify
          </span>
          <span v-else-if="!spotifyConfigured" class="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-800">
            Spotify 未配置
          </span>
          <span v-else-if="isPlaying" class="text-xs px-3 py-1 rounded-full bg-green-100 text-green-800">
            正在播放
          </span>
          <span v-else class="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
            已暫停
          </span>
        </div>
      </div>

      <!-- 搜尋欄 -->
      <div class="p-6 pb-0" v-if="isSpotifyConnected">
        <div class="relative inline-block w-full">
          <input v-model="searchQuery" @input="searchTracks" 
                 placeholder="🔎搜尋歌曲、藝人或專輯..." 
                 class="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      <!-- 曲風按鈕 -->
      <div class="p-6">
        <div class="grid grid-cols-5 gap-4 mb-8" v-if="isSpotifyConnected && currentMode !== 'favorites'">
          <button v-for="genre in spotifyGenres.slice(0, 5)" :key="genre" 
                  @click="searchByGenre(genre)"
                  class="genre-btn py-3 px-6 rounded-lg text-black hover:bg-pink-400 transition-all duration-300 transform hover:scale-105 active:animate-bounce"
                  :class="selectedGenre === genre ? 'bg-pink-500' : 'bg-blue-800'">
            {{ genre }}
          </button>
        </div>
        <div class="grid grid-cols-5 gap-4 mb-8" v-if="isSpotifyConnected && currentMode !== 'favorites'">
          <button v-for="genre in spotifyGenres.slice(5, 10)" :key="genre" 
                  @click="searchByGenre(genre)"
                  class="genre-btn py-3 px-6 rounded-lg text-black hover:bg-pink-400 transition-all duration-300 transform hover:scale-105 active:animate-bounce"
                  :class="selectedGenre === genre ? 'bg-pink-500' : 'bg-blue-800'">
            {{ genre }}
          </button>
        </div>

        <!-- 我的收藏標題 -->
        <div v-if="currentMode === 'favorites'" class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center">
            <font-awesome-icon icon="heart" class="mr-2 text-red-500" />
            我的收藏 ({{ favoriteTrackIds.size }} 首)
          </h2>
          <p class="text-gray-600 text-sm mt-1">你收藏的音樂清單</p>
        </div>

        <!-- 載入中 -->
        <div v-if="loading" class="flex justify-center items-center h-32 mb-6">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span class="ml-3 text-lg">載入中...</span>
        </div>

        <!-- 音樂卡片 -->
        <div class="grid grid-cols-6 gap-4">
          <div v-for="track in displayedTracks" :key="track.id" 
               class="music-card bg-white rounded-lg p-3 shadow-md hover:shadow-lg cursor-pointer border relative"
               :class="{ 'ring-2 ring-green-500': currentTrack.id === track.id }">
            
            <!-- 愛心收藏按鈕 -->
<button @click.stop="toggleFavorite(track)" 
        class="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-300 hover:scale-110 shadow-sm">
  <font-awesome-icon 
    icon="heart"
    class="text-sm transition-all duration-300"
    :class="isFavorite(track.id) ? 'text-pink-500 heart-filled' : 'text-gray-400 hover:text-gray-600 heart-outline'" />
</button>
            
            <!-- 封面 -->
            <div class="w-full h-24 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative"
                 @click="playTrack(track)">
              <img v-if="track.album?.images?.[0]?.url" 
                   :src="track.album.images[0].url" 
                   :alt="track.name" 
                   class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <font-awesome-icon icon="music" class="text-white text-2xl" />
              </div>
              
              <!-- 播放指示器 -->
              <div v-if="currentTrack.id === track.id && isPlaying" 
                   class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div class="bg-green-500 text-white rounded-full p-2 animate-pulse">
                  <font-awesome-icon icon="play" class="text-sm" />
                </div>
              </div>
            </div>
            
            <!-- 歌曲信息 -->
            <div @click="playTrack(track)" class="cursor-pointer">
              <h3 class="font-bold text-sm text-gray-800 truncate mb-1" :title="track.name">
                {{ track.name }}
              </h3>
              <p class="text-xs text-gray-600 truncate mb-1" :title="track.artists?.map(a => a.name).join(', ')">
                {{ track.artists?.map(a => a.name).join(', ') }}
              </p>
              <p class="text-xs text-gray-500 truncate mb-2" v-if="track.album?.name" :title="track.album.name">
                {{ track.album.name }}
              </p>
              
              <!-- 底部信息 -->
              <div class="flex justify-between items-center text-xs">
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full">Spotify</span>
                <span class="text-gray-500" v-if="track.duration_ms">
                  {{ formatTime(Math.floor(track.duration_ms / 1000)) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 未連接 Spotify 提示 -->
          <div v-if="!isSpotifyConnected && spotifyConfigured" class="col-span-6 text-center py-16 text-gray-500">
            <font-awesome-icon :icon="['fab', 'spotify']" class="text-6xl mb-4 text-green-400" />
            <h3 class="text-xl font-medium mb-2">連接 Spotify</h3>
            <p class="text-sm mb-4">連接你的 Spotify 帳戶來播放音樂</p>
            <button @click="connectSpotify" class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              <font-awesome-icon :icon="['fab', 'spotify']" class="mr-2" />
              連接 Spotify
            </button>
          </div>

          <!-- Spotify 未配置提示 -->
          <div v-else-if="!spotifyConfigured" class="col-span-6 text-center py-16 text-gray-500">
            <font-awesome-icon :icon="['fab', 'spotify']" class="text-6xl mb-4 text-gray-400" />
            <h3 class="text-xl font-medium mb-2">Spotify 未配置</h3>
            <p class="text-sm mb-4">請在環境變數中設置 VITE_SPOTIFY_CLIENT_ID</p>
          </div>
          
          <!-- 無歌曲提示 -->
          <div v-else-if="!loading && displayedTracks.length === 0" 
               class="col-span-6 text-center py-16 text-gray-500">
            <font-awesome-icon :icon="currentMode === 'favorites' ? 'heart' : 'search'" class="text-6xl mb-4 text-gray-300" />
            <h3 class="text-xl font-medium mb-2">
              {{ currentMode === 'favorites' ? '還沒有收藏' : '搜尋音樂' }}
            </h3>
            <p class="text-sm">
              {{ currentMode === 'favorites' ? '點擊歌曲右上角的愛心來收藏音樂' : '使用上方搜尋欄或點擊曲風按鈕來尋找音樂' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSpotify } from './composables/useSpotify'

// Spotify 組合式函數
let spotifyComposable = null

try {
  spotifyComposable = useSpotify()
} catch (error) {
  // 創建空的替代對象
  spotifyComposable = {
    isSpotifyConnected: ref(false),
    currentTrack: ref({}),
    isPlaying: ref(false),
    currentTime: ref(0),
    duration: ref(0),
    volume: ref(50),
    isShuffled: ref(false),
    repeatMode: ref('off'),
    spotifyDevices: ref([]),
    connectSpotify: () => {},
    disconnectSpotify: () => {},
    playTrack: () => {},
    togglePlay: () => {},
    previousTrack: () => {},
    nextTrack: () => {},
    seek: () => {},
    setVolume: () => {},
    toggleShuffle: () => {},
    toggleRepeat: () => {},
    searchTracks: () => Promise.resolve([]),
    getRecommendations: () => Promise.resolve([]),
    getUserPlaylists: () => Promise.resolve([]),
    getDevices: () => Promise.resolve([])
  }
}

const {
  isSpotifyConnected,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffled,
  repeatMode,
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
  searchTracks: spotifySearch,
  getRecommendations,
  getUserPlaylists
} = spotifyComposable

// 基本數據
const currentMode = ref('trending')
const loading = ref(false)
const searchQuery = ref('')
const displayedTracks = ref([])

// 收藏功能
const favoriteTrackIds = ref(new Set())
const favoriteTracks = ref([])

// 修改：追蹤當前選中的曲風按鈕 (只能有一個)
const selectedGenre = ref('')

// 檢查 Spotify 是否已配置
const spotifyConfigured = computed(() => {
  try {
    return !!import.meta.env.VITE_SPOTIFY_CLIENT_ID
  } catch (error) {
    return false
  }
})

// Spotify 曲風
const spotifyGenres = ref([
  'pop', 'rock', 'hip-hop', 'electronic', 'jazz', 
  'classical', 'country', 'latin', 'r-n-b', 'folk'
])

// 收藏功能方法
const isFavorite = (trackId) => {
  console.log('檢查收藏狀態:', trackId, favoriteTrackIds.value.has(trackId))
  return favoriteTrackIds.value.has(trackId)
}

const toggleFavorite = (track) => {
  console.log('切換收藏:', track.name, track.id) // 調試信息
  
  if (favoriteTrackIds.value.has(track.id)) {
    // 移除收藏
    favoriteTrackIds.value.delete(track.id)
    favoriteTracks.value = favoriteTracks.value.filter(t => t.id !== track.id)
    console.log('移除收藏') // 調試信息
  } else {
    // 添加收藏
    favoriteTrackIds.value.add(track.id)
    favoriteTracks.value.push(track)
    console.log('添加收藏') // 調試信息
  }
  
  console.log('當前收藏列表:', [...favoriteTrackIds.value]) // 調試信息
  
  // 如果當前在收藏頁面，更新顯示的歌曲
  if (currentMode.value === 'favorites') {
    displayedTracks.value = [...favoriteTracks.value]
  }
  
  // 保存到本地存儲
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
const getVolumeIcon = () => {
  if (volume.value === 0) return 'volume-mute'
  if (volume.value < 30) return 'volume-down'
  if (volume.value < 70) return 'volume-down'
  return 'volume-up'
}

const handleVolumeChange = (event) => {
  const newVolume = parseInt(event.target.value)
  if (setVolume && typeof setVolume === 'function') {
    setVolume(newVolume)
  }
}

// 搜尋功能
const searchTracks = async () => {
  if (!searchQuery.value.trim() || !isSpotifyConnected.value) return
  
  loading.value = true
  try {
    if (spotifySearch && typeof spotifySearch === 'function') {
      const results = await spotifySearch(searchQuery.value)
      displayedTracks.value = results.slice(0, 30)
    }
  } catch (error) {
    console.error('搜尋失敗:', error)
  } finally {
    loading.value = false
  }
}

// 按曲風搜尋
const searchByGenre = async (genre) => {
  // 設置當前選中的曲風 (只有一個會是桃紅色)
  selectedGenre.value = genre
  
  loading.value = true
  try {
    if (spotifySearch && typeof spotifySearch === 'function') {
      const results = await spotifySearch(`genre:${genre}`, 'track')
      displayedTracks.value = results.slice(0, 30)
    }
  } catch (error) {
    console.error('曲風搜尋失敗:', error)
  } finally {
    loading.value = false
  }
}

// 設置模式
const setCurrentMode = async (mode) => {
  currentMode.value = mode
  
  if (mode === 'favorites') {
    // 顯示收藏的歌曲
    displayedTracks.value = [...favoriteTracks.value]
    return
  }
  
  if (!isSpotifyConnected.value) return

  loading.value = true
  
  try {
    let results = []
    
    switch (mode) {
      case 'trending':
        if (spotifySearch && typeof spotifySearch === 'function') {
          results = await spotifySearch('top hits 2024', 'track')
        }
        break
      case 'latest':
        if (spotifySearch && typeof spotifySearch === 'function') {
          results = await spotifySearch('new releases', 'track')
        }
        break
      case 'random':
        if (getRecommendations && typeof getRecommendations === 'function') {
          results = await getRecommendations()
        }
        break
    }
    
    displayedTracks.value = results.slice(0, 30)
  } catch (error) {
    console.error('載入失敗:', error)
  } finally {
    loading.value = false
  }
}

// 工具函數
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 計算屬性
const progressPercentage = computed(() => {
  return duration.value ? (currentTime.value / duration.value) * 100 : 0
})

// 監聽 Spotify 連接狀態
watch(isSpotifyConnected, async (connected) => {
  if (connected && currentMode.value !== 'favorites') {
    await setCurrentMode('trending')
  }
}, { immediate: false })

// 初始化
onMounted(async () => {
  // 載入收藏
  loadFavoritesFromStorage()
  
  if (isSpotifyConnected.value && currentMode.value !== 'favorites') {
    await setCurrentMode('trending')
  }
})
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
}

.main-content {
  background: linear-gradient(90deg, #002879 0%, #e5e7eb 100%);
}

.progress-bar {
  background: linear-gradient(90deg, #1db954 0%, #1ed760 100%);
  transition: width 0.3s ease;
}

.music-card {
  transition: all 0.3s ease;
  position: relative;
}

.music-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-circle {
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 音量滑桿樣式 */
.volume-slider {
  background: #4a5568;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1db954;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1db954;
  cursor: pointer;
  border: none;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 曲風按鈕特殊樣式 */
.genre-btn {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
}

.genre-btn:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px) scale(1.05);
}

.genre-btn:active {
  animation: bounce 0.3s ease-in-out;
  transform: translateY(2px) scale(0.98);
}

@keyframes bounce {
  0% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-8px) scale(1.02); }
  50% { transform: translateY(-4px) scale(1.01); }
  75% { transform: translateY(-2px) scale(1.005); }
  100% { transform: translateY(0) scale(1); }
}

/* 空心愛心效果 */
.heart-outline {
  color: #a2a3a3 !important;
  -webkit-text-stroke: 0 #758094;
  text-stroke: 0 #164392;
}

.heart-outline:hover {
  -webkit-text-stroke: 1.5px #2661d6;
  text-stroke: 1.5px #079125;
}

/* 實心愛心效果 */
.heart-filled {
  color: #ec4899 !important;
  -webkit-text-stroke: 0;
  text-stroke: 0;
  filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.3));
}
</style>