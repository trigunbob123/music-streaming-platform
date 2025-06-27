<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 左側邊欄 -->
    <div class="w-64 sidebar text-white p-4">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-yellow-400">DDM360</h1>
        <div class="flex space-x-2">
          <button v-if="!isSpotifyConnected" @click="connectSpotify" 
                  class="text-green-400 hover:text-green-300 text-sm">
            <font-awesome-icon :icon="['fab', 'spotify']" class="mr-1" />
            連接 Spotify
          </button>
          <button v-else @click="disconnectSpotify" 
                  class="text-green-400 hover:text-green-300 text-sm">
            <font-awesome-icon :icon="['fab', 'spotify']" class="mr-1" />
            已連接
          </button>
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
        <button @click="setCurrentMode('playlists')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
                :class="{ 'bg-gray-700': currentMode === 'playlists' }">
          <font-awesome-icon icon="list" class="mr-3" />
          我的播放清單
        </button>
      </nav>

      <!-- Spotify 播放器狀態 -->
      <div v-if="isSpotifyConnected" class="mt-auto">
        <div class="bg-green-900 p-3 rounded-lg">
          <div class="flex items-center text-green-300 text-sm">
            <font-awesome-icon :icon="['fab', 'spotify']" class="mr-2" />
            <span>Spotify 已連接</span>
          </div>
          <div v-if="spotifyDevices.length > 0" class="mt-2">
            <select v-model="selectedDevice" @change="setActiveDevice" 
                    class="w-full bg-green-800 text-green-100 text-xs p-1 rounded">
              <option value="">選擇播放設備</option>
              <option v-for="device in spotifyDevices" :key="device.id" :value="device.id">
                {{ device.name }} ({{ device.type }})
              </option>
            </select>
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
          <button @click="setVolume" class="btn btn-circle bg-transparent text-white hover:bg-gray-700">
            <font-awesome-icon :icon="volume > 50 ? 'volume-up' : volume > 0 ? 'volume-down' : 'volume-mute'" class="text-xl" />
          </button>
        </div>

        <!-- 當前播放歌曲 -->
        <div class="flex items-center justify-center mt-4" v-if="currentTrack.name">
          <div class="w-12 h-12 rounded-lg mr-3 overflow-hidden">
            <img v-if="currentTrack.album?.images?.[0]?.url" 
                 :src="currentTrack.album.images[0].url" 
                 :alt="currentTrack.name" 
                 class="w-full h-full object-cover">
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
          <span v-if="!isSpotifyConnected" class="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800">
            未連接 Spotify
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
        <div class="relative">
          <input v-model="searchQuery" @input="searchTracks" 
                 placeholder="搜尋歌曲、藝人或專輯..." 
                 class="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
          <font-awesome-icon icon="search" class="absolute left-3 top-3.5 text-gray-400" />
        </div>
      </div>

      <!-- 曲風按鈕 -->
      <div class="p-6">
        <div class="grid grid-cols-5 gap-4 mb-8" v-if="isSpotifyConnected">
          <button v-for="genre in spotifyGenres.slice(0, 5)" :key="genre" 
                  @click="searchByGenre(genre)"
                  class="btn py-3 px-6 rounded-lg bg-green-500 text-white hover:bg-green-600">
            {{ genre }}
          </button>
        </div>
        <div class="grid grid-cols-5 gap-4 mb-8" v-if="isSpotifyConnected">
          <button v-for="genre in spotifyGenres.slice(5, 10)" :key="genre" 
                  @click="searchByGenre(genre)"
                  class="btn py-3 px-6 rounded-lg bg-green-500 text-white hover:bg-green-600">
            {{ genre }}
          </button>
        </div>

        <!-- 載入中 -->
        <div v-if="loading" class="flex justify-center items-center h-32 mb-6">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span class="ml-3 text-lg">載入中...</span>
        </div>

        <!-- 音樂卡片 -->
        <div class="grid grid-cols-6 gap-4">
          <div v-for="track in displayedTracks" :key="track.id" 
               @click="playTrack(track)"
               class="music-card bg-white rounded-lg p-4 shadow-md hover:shadow-lg cursor-pointer border"
               :class="{ 'ring-2 ring-green-500': currentTrack.id === track.id }">
            
            <!-- 封面 -->
            <div class="w-full h-32 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
              <img v-if="track.album?.images?.[0]?.url" 
                   :src="track.album.images[0].url" 
                   :alt="track.name" 
                   class="w-full h-full object-cover">
              <div v-else class="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <font-awesome-icon icon="music" class="text-white text-3xl" />
              </div>
              
              <!-- 播放指示器 -->
              <div v-if="currentTrack.id === track.id && isPlaying" 
                   class="absolute top-2 right-2">
                <div class="bg-green-500 text-white rounded-full p-1 animate-pulse">
                  <font-awesome-icon icon="play" class="text-xs" />
                </div>
              </div>
            </div>
            
            <!-- 歌曲信息 -->
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
          
          <!-- 未連接 Spotify 提示 -->
          <div v-if="!isSpotifyConnected" class="col-span-6 text-center py-16 text-gray-500">
            <font-awesome-icon :icon="['fab', 'spotify']" class="text-6xl mb-4 text-green-400" />
            <h3 class="text-xl font-medium mb-2">連接 Spotify</h3>
            <p class="text-sm mb-4">連接你的 Spotify 帳戶來播放音樂</p>
            <button @click="connectSpotify" class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              <font-awesome-icon :icon="['fab', 'spotify']" class="mr-2" />
              連接 Spotify
            </button>
          </div>
          
          <!-- 無歌曲提示 -->
          <div v-else-if="!loading && displayedTracks.length === 0" 
               class="col-span-6 text-center py-16 text-gray-500">
            <font-awesome-icon icon="search" class="text-6xl mb-4 text-gray-300" />
            <h3 class="text-xl font-medium mb-2">搜尋音樂</h3>
            <p class="text-sm">使用上方搜尋欄或點擊曲風按鈕來尋找音樂</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSpotify } from './composables/useSpotify'

// Spotify 相關
const {
  isSpotifyConnected,
  spotifyPlayer,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffled,
  repeatMode,
  spotifyDevices,
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
  getUserPlaylists,
  getDevices
} = useSpotify()

// 基本數據
const currentMode = ref('trending')
const loading = ref(false)
const searchQuery = ref('')
const selectedDevice = ref('')
const displayedTracks = ref([])

// Spotify 曲風
const spotifyGenres = ref([
  'pop', 'rock', 'hip-hop', 'electronic', 'jazz', 
  'classical', 'country', 'latin', 'r-n-b', 'folk'
])

// 搜尋功能
const searchTracks = async () => {
  if (!searchQuery.value.trim() || !isSpotifyConnected.value) return
  
  loading.value = true
  try {
    const results = await spotifySearch(searchQuery.value)
    displayedTracks.value = results.slice(0, 30) // 限制顯示數量
  } catch (error) {
    console.error('搜尋失敗:', error)
  } finally {
    loading.value = false
  }
}

// 按曲風搜尋
const searchByGenre = async (genre) => {
  loading.value = true
  try {
    const results = await spotifySearch(`genre:${genre}`, 'track')
    displayedTracks.value = results.slice(0, 30)
  } catch (error) {
    console.error('曲風搜尋失敗:', error)
  } finally {
    loading.value = false
  }
}

// 設置模式
const setCurrentMode = async (mode) => {
  currentMode.value = mode
  loading.value = true
  
  try {
    let results = []
    
    switch (mode) {
      case 'trending':
        // 獲取熱門歌曲
        results = await spotifySearch('year:2024', 'track')
        break
      case 'latest':
        // 獲取最新歌曲
        results = await spotifySearch('tag:new', 'track')
        break
      case 'random':
        // 獲取推薦歌曲
        results = await getRecommendations()
        break
      case 'playlists':
        // 獲取用戶播放清單
        const playlists = await getUserPlaylists()
        // 這裡可以進一步處理播放清單
        results = []
        break
    }
    
    displayedTracks.value = results.slice(0, 30)
  } catch (error) {
    console.error('載入失敗:', error)
  } finally {
    loading.value = false
  }
}

// 設置播放設備
const setActiveDevice = async () => {
  if (selectedDevice.value && spotifyPlayer.value) {
    try {
      await fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [selectedDevice.value],
          play: false
        })
      })
    } catch (error) {
      console.error('設置設備失敗:', error)
    }
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
  if (connected) {
    await getDevices()
    await setCurrentMode('trending')
  }
})

// 初始化
onMounted(async () => {
  // Spotify 會自動嘗試連接
  if (isSpotifyConnected.value) {
    await setCurrentMode('trending')
  }
})
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
}

.main-content {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
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
}
</style>