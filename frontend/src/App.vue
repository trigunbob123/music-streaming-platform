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
      <!-- 頂部播放器 - 新布局 -->
      <div class="bg-gray-800 p-6 text-white">
        <div class="flex items-center justify-between">
          <!-- 左側：當前播放歌曲 -->
          <div class="flex items-center min-w-0 flex-1" v-if="currentTrack.name">
            <!-- 放大的封面 -->
            <div class="w-20 h-20 rounded-lg mr-4 overflow-hidden flex-shrink-0">
              <img v-if="currentTrack.album?.images?.[0]?.url" 
                   :src="currentTrack.album.images[0].url" 
                   :alt="currentTrack.name" 
                   class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-gradient-to-br from-green-500 to-purple-600 flex items-center justify-center">
                <font-awesome-icon icon="music" class="text-white text-2xl" />
              </div>
            </div>
            <!-- 歌曲信息 -->
            <div class="min-w-0 flex-1">
              <p class="font-medium text-lg truncate" :title="currentTrack.name">{{ currentTrack.name }}</p>
              <p class="text-sm text-gray-300 truncate" :title="currentTrack.artists?.map(a => a.name).join(', ')">
                {{ currentTrack.artists?.map(a => a.name).join(', ') }}
              </p>
              <p class="text-xs text-green-400 truncate" v-if="currentTrack.album?.name" :title="currentTrack.album.name">
                {{ currentTrack.album.name }}
              </p>
            </div>
          </div>

          <!-- 右側：播放控制和音量 -->
          <div class="flex items-center space-x-4 flex-shrink-0">
            <!-- 音頻均衡器視覺效果 - 總是顯示 -->
            <div class="audio-visualizer">
              <div class="equalizer-bars">
                <div 
                  v-for="i in 16" 
                  :key="i" 
                  class="equalizer-bar" 
                  :class="{ 'playing': isPlaying }"
                ></div>
              </div>
            </div>
            
            <!-- 播放控制按鈕 -->
            <div class="play-controls-container">
              <button @click="handlePreviousTrack" class="control-button">
                <font-awesome-icon icon="step-backward" class="text-lg" />
              </button>
              <button @click="handleTogglePlay" class="control-button">
                <font-awesome-icon :icon="isPlaying ? 'pause' : 'play'" class="text-lg" />
              </button>
              <button @click="handleNextTrack" class="control-button">
                <font-awesome-icon icon="step-forward" class="text-lg" />
              </button>
            </div>
            
            <!-- 進度條區域 -->
            <div class="flex items-center space-x-2" style="min-width: 300px;">
              <span class="text-xs text-gray-300 w-12 text-right">{{ formatTime(currentTime) }}</span>
              <div class="flex-1 bg-gray-600 rounded-full h-2 cursor-pointer relative" @click="handleSeek">
                <div class="progress-bar h-2 rounded-full absolute top-0 left-0" 
                     :style="{ width: progressPercentage + '%' }"></div>
              </div>
              <span class="text-xs text-gray-300 w-6">{{ formatTime(duration) }}</span>
            </div>

            <!-- 播放模式控制 -->
            <div class="flex items-center space-x-2">
              <button @click="toggleShuffle" class="btn btn-circle bg-transparent text-white hover:bg-gray-700"
                      :class="{ 'text-green-400': isShuffled }">
                <font-awesome-icon icon="random" class="text-lg" />
              </button>
              <button @click="toggleRepeat" class="btn btn-circle bg-transparent text-white hover:bg-gray-700"
                      :class="{ 'text-green-400': repeatMode !== 'off' }">
                <font-awesome-icon :icon="repeatMode === 'track' ? 'redo' : 'repeat'" class="text-lg" />
              </button>
            </div>

            <!-- 音量控制 -->
            <div class="flex items-center space-x-2">
              <button class="btn btn-circle bg-transparent text-white hover:bg-gray-700">
                <font-awesome-icon :icon="getVolumeIcon()" class="text-lg" />
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
        </div>
      </div>

      <!-- 搜尋欄 -->
      <div class="p-2 pb-0" v-if="isSpotifyConnected">
        <div class="relative inline-block w-full">
          <input v-model="searchQuery" @input="searchTracks" 
                 placeholder="🔎搜尋歌曲、藝人或專輯..." 
                 class="w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      <!-- 曲風按鈕 -->
      <div class="p-6">
        <!-- 新的播放隊列控制區 - 簡單版本 -->
        <div class="playlist-control-panel" v-if="isSpotifyConnected">
          <div class="playlist-controls">
            <!-- 第一組 -->
            <div class="control-group">
              <div class="dropdown-wrapper">
                <button class="genre-btn-simple" @click="toggleGenreDropdown(0)">
                  {{ playlistConfig[0].genre }} ▼
                </button>
                <div v-if="genreDropdownOpen[0]" class="dropdown-simple">
                  <div v-for="genre in availableGenres" :key="genre" 
                       @click="selectGenre(0, genre)" class="dropdown-item">
                    {{ genre }}
                  </div>
                </div>
              </div>
              <div class="dropdown-wrapper">
                <button class="number-btn-simple" @click="toggleNumberDropdown(0)">
                  {{ playlistConfig[0].count }} ▼
                </button>
                <div v-if="numberDropdownOpen[0]" class="dropdown-simple">
                  <div v-for="num in [1,2,3,4,5]" :key="num" 
                       @click="selectNumber(0, num)" class="dropdown-item">
                    {{ num }}
                  </div>
                </div>
              </div>
            </div>

            <span class="plus-sign">+</span>

            <!-- 第二組 -->
            <div class="control-group">
              <div class="dropdown-wrapper">
                <button class="genre-btn-simple" @click="toggleGenreDropdown(1)">
                  {{ playlistConfig[1].genre }} ▼
                </button>
                <div v-if="genreDropdownOpen[1]" class="dropdown-simple">
                  <div v-for="genre in availableGenres" :key="genre" 
                       @click="selectGenre(1, genre)" class="dropdown-item">
                    {{ genre }}
                  </div>
                </div>
              </div>
              <div class="dropdown-wrapper">
                <button class="number-btn-simple" @click="toggleNumberDropdown(1)">
                  {{ playlistConfig[1].count }} ▼
                </button>
                <div v-if="numberDropdownOpen[1]" class="dropdown-simple">
                  <div v-for="num in [1,2,3,4,5]" :key="num" 
                       @click="selectNumber(1, num)" class="dropdown-item">
                    {{ num }}
                  </div>
                </div>
              </div>
            </div>

            <span class="plus-sign">+</span>

            <!-- 第三組 -->
            <div class="control-group">
              <div class="dropdown-wrapper">
                <button class="genre-btn-simple" @click="toggleGenreDropdown(2)">
                  {{ playlistConfig[2].genre }} ▼
                </button>
                <div v-if="genreDropdownOpen[2]" class="dropdown-simple">
                  <div v-for="genre in availableGenres" :key="genre" 
                       @click="selectGenre(2, genre)" class="dropdown-item">
                    {{ genre }}
                  </div>
                </div>
              </div>
              <div class="dropdown-wrapper">
                <button class="number-btn-simple" @click="toggleNumberDropdown(2)">
                  {{ playlistConfig[2].count }} ▼
                </button>
                <div v-if="numberDropdownOpen[2]" class="dropdown-simple">
                  <div v-for="num in [1,2,3,4,5]" :key="num" 
                       @click="selectNumber(2, num)" class="dropdown-item">
                    {{ num }}
                  </div>
                </div>
              </div>
            </div>

            <button class="play-btn-simple" @click="startCustomPlaylist">
              ▶ 播放
            </button>
          </div>
          
          <div v-if="customPlaylistActive" class="playlist-status">
            {{ currentPlaylistStatus }}
          </div>
        </div>

        <!-- 原有的曲風按鈕 - 確保顯示 -->
        <div v-if="isSpotifyConnected && currentMode !== 'favorites'">
          <div class="grid grid-cols-5 gap-4 mb-4">
            <button v-for="genre in spotifyGenres.slice(0, 5)" :key="genre" 
                    @click="searchByGenre(genre)"
                    class="genre-btn py-3 px-6 rounded-lg text-black hover:bg-pink-400 transition-all duration-300 transform hover:scale-105 active:animate-bounce"
                    :class="selectedGenre === genre ? 'bg-pink-500' : 'bg-blue-800'">
              {{ genre.toUpperCase() }}
            </button>
          </div>
          <div class="grid grid-cols-5 gap-4 mb-8">
            <button v-for="genre in spotifyGenres.slice(5, 10)" :key="genre" 
                    @click="searchByGenre(genre)"
                    class="genre-btn py-3 px-6 rounded-lg text-black hover:bg-pink-400 transition-all duration-300 transform hover:scale-105 active:animate-bounce"
                    :class="selectedGenre === genre ? 'bg-pink-500' : 'bg-blue-800'">
              {{ genre.toUpperCase() }}
            </button>
          </div>
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
                :icon="isFavorite(track.id) ? ['fas', 'heart'] : ['far', 'heart']"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  'classical', 'country', 'latin', 'r&b', 'folk'
])

// 新增：自定義播放隊列功能
const availableGenres = ref(['Jazz', 'Country', 'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Classical', 'Latin', 'R&B', 'Folk'])

// 播放隊列配置
const playlistConfig = ref([
  { genre: 'Jazz', count: 3 },
  { genre: 'Country', count: 5 },
  { genre: 'Rock', count: 1 }
])

// 下拉選單狀態
const genreDropdownOpen = ref([false, false, false])
const numberDropdownOpen = ref([false, false, false])

// 自定義播放隊列狀態
const customPlaylistActive = ref(false)
const customPlaylistQueue = ref([]) // 完整的播放隊列
const customPlaylistIndex = ref(0) // 當前播放位置
const currentPlaylistStatus = ref('')

// 播放隊列監控
let playlistMonitorInterval = null
let lastPlayTime = ref(0)
let lastTrackId = ref('')

// 下拉選單控制函數
const toggleGenreDropdown = (index) => {
  genreDropdownOpen.value = genreDropdownOpen.value.map((_, i) => i === index ? !genreDropdownOpen.value[i] : false)
  numberDropdownOpen.value = [false, false, false]
}

const toggleNumberDropdown = (index) => {
  numberDropdownOpen.value = numberDropdownOpen.value.map((_, i) => i === index ? !numberDropdownOpen.value[i] : false)
  genreDropdownOpen.value = [false, false, false]
}

const selectGenre = (index, genre) => {
  playlistConfig.value[index].genre = genre
  genreDropdownOpen.value[index] = false
}

const selectNumber = (index, number) => {
  playlistConfig.value[index].count = number
  numberDropdownOpen.value[index] = false
}

// 建立自定義播放隊列
const startCustomPlaylist = async () => {
  try {
    loading.value = true
    customPlaylistActive.value = true
    customPlaylistQueue.value = []  // 清空隊列
    customPlaylistIndex.value = 0
    
    console.log('🎵 開始建立自定義播放隊列...')
    console.log('播放配置:', playlistConfig.value)
    
    // 按順序建立播放隊列
    for (let groupIndex = 0; groupIndex < playlistConfig.value.length; groupIndex++) {
      const config = playlistConfig.value[groupIndex]
      console.log(`📀 第${groupIndex + 1}組：獲取 ${config.genre} 曲風的 ${config.count} 首歌曲...`)
      
      const searchGenre = config.genre.toLowerCase().replace('-', ' ')
      
      try {
        const genreTracks = await spotifySearch(`genre:${searchGenre}`, 'track')
        if (genreTracks && genreTracks.length > 0) {
          // 隨機選擇歌曲但保持設定的數量
          const shuffledTracks = [...genreTracks].sort(() => Math.random() - 0.5)
          const selectedTracks = shuffledTracks.slice(0, config.count)
          
          // 為每首歌添加組別和位置信息
          selectedTracks.forEach((track, trackIndex) => {
            customPlaylistQueue.value.push({
              ...track,
              genreGroup: groupIndex,
              genreName: config.genre,
              trackIndexInGroup: trackIndex,
              totalInGroup: config.count
            })
          })
          
          console.log(`✅ 第${groupIndex + 1}組 ${config.genre}: 已添加 ${selectedTracks.length} 首歌曲`)
        } else {
          console.warn(`⚠️ 第${groupIndex + 1}組 ${config.genre}: 找不到歌曲`)
        }
      } catch (error) {
        console.error(`❌ 獲取第${groupIndex + 1}組 ${config.genre} 歌曲失敗:`, error)
      }
    }
    
    console.log('🎵 播放隊列建立完成，總共', customPlaylistQueue.value.length, '首歌曲')
    console.log('播放隊列:', customPlaylistQueue.value.map(t => `${t.genreName}-${t.name}`))
    
    if (customPlaylistQueue.value.length > 0) {
      // 開始播放第一首歌
      await playTrack(customPlaylistQueue.value[0])
      updatePlaylistStatus()
      startPlaylistMonitoring()
    } else {
      alert('無法建立播放隊列，請重試')
      customPlaylistActive.value = false
    }
    
  } catch (error) {
    console.error('❌ 建立播放隊列失敗:', error)
    alert('建立播放隊列失敗: ' + error.message)
    customPlaylistActive.value = false
  } finally {
    loading.value = false
  }
}

// 播放隊列監控
const startPlaylistMonitoring = () => {
  stopPlaylistMonitoring() // 確保只有一個監控在運行
  
  playlistMonitorInterval = setInterval(() => {
    if (!customPlaylistActive.value) {
      stopPlaylistMonitoring()
      return
    }
    
    // 檢查歌曲是否結束
    const currentTimeSeconds = currentTime.value
    const durationSeconds = duration.value
    
    // 如果歌曲接近結束（剩餘3秒）或已經結束
    if (durationSeconds > 0 && currentTimeSeconds >= durationSeconds - 3) {
      console.log('🎵 檢測到歌曲即將結束，準備播放下一首...')
      playNextInCustomQueue()
    }
  }, 2000) // 每2秒檢查一次
  
  console.log('🎵 播放隊列監控已啟動')
}

const stopPlaylistMonitoring = () => {
  if (playlistMonitorInterval) {
    clearInterval(playlistMonitorInterval)
    playlistMonitorInterval = null
    console.log('🎵 播放隊列監控已停止')
  }
}

// 播放隊列中的下一首歌曲
const playNextInCustomQueue = async () => {
  if (!customPlaylistActive.value || customPlaylistQueue.value.length === 0) {
    console.log('🎵 播放隊列未啟動或為空')
    return false
  }
  
  const nextIndex = customPlaylistIndex.value + 1
  
  if (nextIndex >= customPlaylistQueue.value.length) {
    console.log('🎵 自定義播放隊列播放完畢')
    customPlaylistActive.value = false
    currentPlaylistStatus.value = '播放隊列已完成 ✅'
    stopPlaylistMonitoring()
    
    // 3秒後清除狀態
    setTimeout(() => {
      currentPlaylistStatus.value = ''
    }, 3000)
    return false
  }
  
  currentPlaylistIndex.value = nextIndex
  const nextTrack = customPlaylistQueue.value[nextIndex]
  
  console.log(`🎵 播放下一首: ${nextTrack.genreName} - ${nextTrack.name} (${nextIndex + 1}/${customPlaylistQueue.value.length})`)
  
  try {
    await playTrack(nextTrack)
    updatePlaylistStatus()
    return true
  } catch (error) {
    console.error('❌ 播放下一首失敗:', error)
    return false
  }
}

// 更新當前隊列位置（當用戶手動切換歌曲時）
const updateCurrentQueuePosition = (trackId) => {
  const trackIndex = customPlaylistQueue.value.findIndex(track => track.id === trackId)
  if (trackIndex !== -1) {
    customPlaylistIndex.value = trackIndex
    console.log(`🎵 更新隊列位置: ${trackIndex + 1}/${customPlaylistQueue.value.length}`)
  }
}

// 更新播放狀態顯示
const updatePlaylistStatus = () => {
  if (!customPlaylistActive.value || customPlaylistQueue.value.length === 0) {
    currentPlaylistStatus.value = ''
    return
  }
  
  const currentTrackInQueue = customPlaylistQueue.value[customPlaylistIndex.value]
  if (currentTrackInQueue) {
    const groupNumber = currentTrackInQueue.genreGroup + 1
    const trackInGroup = currentTrackInQueue.trackIndexInGroup + 1
    const totalInGroup = currentTrackInQueue.totalInGroup
    const overallProgress = `${customPlaylistIndex.value + 1}/${customPlaylistQueue.value.length}`
    
    currentPlaylistStatus.value = `播放中：第${groupNumber}組 ${currentTrackInQueue.genreName} (${trackInGroup}/${totalInGroup}) | 總進度: ${overallProgress} | ${currentTrackInQueue.name}`
  }
}

// 確保播放控制函數有效
const handlePreviousTrack = () => {
  console.log('點擊上一首按鈕')
  
  if (customPlaylistActive.value) {
    // 自定義播放隊列模式下的上一首
    const prevIndex = customPlaylistIndex.value - 1
    if (prevIndex >= 0) {
      customPlaylistIndex.value = prevIndex
      const prevTrack = customPlaylistQueue.value[prevIndex]
      playTrack(prevTrack)
      updatePlaylistStatus()
      console.log(`🎵 播放上一首: ${prevTrack.genreName} - ${prevTrack.name}`)
    } else {
      console.log('🎵 已經是第一首歌曲')
    }
  } else {
    // 普通模式
    if (previousTrack && typeof previousTrack === 'function') {
      previousTrack()
    } else {
      console.warn('previousTrack 函數不可用')
    }
  }
}

const handleNextTrack = () => {
  console.log('點擊下一首按鈕') 
  
  if (customPlaylistActive.value) {
    // 自定義播放隊列模式下的下一首
    playNextInCustomQueue()
  } else {
    // 普通模式
    if (nextTrack && typeof nextTrack === 'function') {
      nextTrack()
    } else {
      console.warn('nextTrack 函數不可用')
    }
  }
}

const handleTogglePlay = () => {
  console.log('點擊播放/暫停按鈕')
  if (togglePlay && typeof togglePlay === 'function') {
    togglePlay()
  } else {
    console.warn('togglePlay 函數不可用')
  }
}

// 點擊外部關閉下拉選單
const closeAllDropdowns = () => {
  genreDropdownOpen.value = [false, false, false]
  numberDropdownOpen.value = [false, false, false]
}

// 收藏功能方法
const isFavorite = (trackId) => {
  return favoriteTrackIds.value.has(trackId)
}

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

// 進度條點擊處理
const handleSeek = (event) => {
  if (!duration.value || !seek || typeof seek !== 'function') return
  
  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const progressPercent = clickX / rect.width
  const positionMs = Math.floor(progressPercent * duration.value * 1000)
  
  seek(event)
}

// 按曲風搜尋
const searchByGenre = async (genre) => {
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
  
  // 如果切換到其他模式，停止自定義播放隊列
  if (customPlaylistActive.value && mode !== 'custom') {
    customPlaylistActive.value = false
    stopPlaylistMonitoring()
    currentPlaylistStatus.value = ''
  }
  
  if (mode === 'favorites') {
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

// 音頻均衡器動態效果
const audioFrequencyData = ref(Array(16).fill(0.2))
const bassFrequencies = [0, 1, 2, 3, 4]
const midFrequencies = [5, 6, 7, 8, 9, 10]
const highFrequencies = [11, 12, 13, 14, 15]

const simulateAudioSpectrum = () => {
  if (!isPlaying.value) return
  
  const currentTimeMs = Date.now()
  const beatPeriod = 600
  const beatPhase = (currentTimeMs % beatPeriod) / beatPeriod
  const beatIntensity = Math.max(0, Math.sin(beatPhase * Math.PI * 2) * 1.2 + 0.3)
  
  audioFrequencyData.value = audioFrequencyData.value.map((currentValue, index) => {
    let newValue = currentValue
    
    if (bassFrequencies.includes(index)) {
      const bassRandom = Math.random() * 0.5 + 0.3
      const bassPattern = beatIntensity * (0.7 + Math.sin(currentTimeMs * 0.003 + index) * 0.3)
      newValue = bassRandom * bassPattern
    } else if (midFrequencies.includes(index)) {
      const midRandom = Math.random() * 0.6 + 0.2
      const midPattern = Math.sin(currentTimeMs * 0.005 + index * 0.5) * 0.3 + 0.5
      const rhythmBoost = Math.sin(beatPhase * Math.PI * 4) * 0.2
      newValue = midRandom * midPattern + rhythmBoost
    } else if (highFrequencies.includes(index)) {
      const highRandom = Math.random() * 0.8 + 0.15
      const highPattern = Math.sin(currentTimeMs * 0.008 + index * 1.2) * 0.4 + 0.3
      const sparkle = Math.random() > 0.7 ? Math.random() * 0.4 : 0
      newValue = highRandom * highPattern + sparkle
    }
    
    const smoothing = 0.7
    return currentValue * smoothing + newValue * (1 - smoothing)
  })
  
  updateEqualizerBars()
}

const updateEqualizerBars = () => {
  const bars = document.querySelectorAll('.equalizer-bar')
  bars.forEach((bar, index) => {
    const intensity = audioFrequencyData.value[index]
    const height = Math.max(10, Math.min(100, intensity * 120))
    
    bar.style.height = `${height}%`
    
    if (intensity > 0.7) {
      const glowIntensity = (intensity - 0.7) / 0.3
      bar.style.boxShadow = `
        0 0 ${glowIntensity * 8}px rgba(255, 0, 255, ${glowIntensity * 0.6}),
        0 0 ${glowIntensity * 15}px rgba(0, 255, 255, ${glowIntensity * 0.3})
      `
    } else if (intensity > 0.5) {
      const midGlow = (intensity - 0.5) / 0.2
      bar.style.boxShadow = `0 0 ${midGlow * 4}px rgba(128, 0, 255, ${midGlow * 0.4})`
    } else {
      bar.style.boxShadow = 'none'
    }
    
    if (bassFrequencies.includes(index)) {
      bar.style.filter = `hue-rotate(${intensity * 30}deg) saturate(${1 + intensity * 0.5})`
    } else if (highFrequencies.includes(index)) {
      bar.style.filter = `hue-rotate(${-intensity * 20}deg) saturate(${1 + intensity * 0.8})`
    } else {
      bar.style.filter = `saturate(${1 + intensity * 0.6})`
    }
  })
}

let equalizerInterval = null
const startEqualizerAnimation = () => {
  if (equalizerInterval) clearInterval(equalizerInterval)
  equalizerInterval = setInterval(simulateAudioSpectrum, 80)
}

const stopEqualizerAnimation = () => {
  if (equalizerInterval) {
    clearInterval(equalizerInterval)
    equalizerInterval = null
  }
  
  const fadeOut = () => {
    audioFrequencyData.value = audioFrequencyData.value.map(value => value * 0.9)
    updateEqualizerBars()
    
    if (Math.max(...audioFrequencyData.value) > 0.05) {
      setTimeout(fadeOut, 50)
    } else {
      audioFrequencyData.value.fill(0.15)
      const bars = document.querySelectorAll('.equalizer-bar')
      bars.forEach(bar => {
        bar.style.height = '15%'
        bar.style.boxShadow = 'none'
        bar.style.filter = 'none'
      })
    }
  }
  fadeOut()
}

// 計算屬性
const progressPercentage = computed(() => {
  return duration.value ? (currentTime.value / duration.value) * 100 : 0
})

// 監聽播放狀態變化
watch(isPlaying, (playing) => {
  if (playing) {
    startEqualizerAnimation()
  } else {
    stopEqualizerAnimation()
  }
}, { immediate: true })

// 強制顯示均衡器（即使沒有播放歌曲也顯示）
watch(() => isSpotifyConnected.value, (connected) => {
  if (connected) {
    // 初始化均衡器顯示
    setTimeout(() => {
      startEqualizerAnimation()
    }, 1000)
  }
})

// 監聽 Spotify 連接狀態
watch(isSpotifyConnected, async (connected) => {
  if (connected && currentMode.value !== 'favorites') {
    await setCurrentMode('trending')
  }
}, { immediate: false })

// 初始化
onMounted(async () => {
  loadFavoritesFromStorage()
  
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown-wrapper')) {
      closeAllDropdowns()
    }
  })
  
  if (isSpotifyConnected.value && currentMode.value !== 'favorites') {
    await setCurrentMode('trending')
  }
  
  // 確保均衡器初始化
  setTimeout(() => {
    if (isSpotifyConnected.value) {
      startEqualizerAnimation()
    }
  }, 500)
})

// 清理資源
onUnmounted(() => {
  if (equalizerInterval) {
    clearInterval(equalizerInterval)
  }
  
  // 清理播放隊列監控
  stopPlaylistMonitoring()
  
  document.removeEventListener('click', closeAllDropdowns)
})
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
}

.main-content {
  background: linear-gradient(90deg, #191f30 0%, #e5e7eb 100%);
}

.progress-bar {
  background: linear-gradient(90deg, #1db954 0%, #1ed760 100%);
  transition: width 0.3s ease;
  position: relative;
  z-index: 1;
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

/* 音頻均衡器視覺效果 */
.audio-visualizer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  height: 50px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.equalizer-bars {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 100%;
  height: 40px;
  gap: 2px;
}

.equalizer-bar {
  width: 10px;
  min-height: 4px;
  background: linear-gradient(
    to top,
    #00ffff 0%,
    #0080ff 25%,
    #8000ff 50%,
    #ff00ff 75%,
    #ff0080 100%
  );
  border-radius: 3px;
  transition: height 0.08s ease-out, box-shadow 0.1s ease, filter 0.1s ease;
  animation: none;
  position: relative;
}

.equalizer-bar:nth-child(1),
.equalizer-bar:nth-child(2),
.equalizer-bar:nth-child(3),
.equalizer-bar:nth-child(4),
.equalizer-bar:nth-child(5) {
  background: linear-gradient(
    to top,
    #00ffff 0%,
    #00c0ff 30%,
    #0080ff 60%,
    #4080ff 100%
  );
}

.equalizer-bar:nth-child(6),
.equalizer-bar:nth-child(7),
.equalizer-bar:nth-child(8),
.equalizer-bar:nth-child(9),
.equalizer-bar:nth-child(10),
.equalizer-bar:nth-child(11) {
  background: linear-gradient(
    to top,
    #0080ff 0%,
    #4040ff 25%,
    #8000ff 50%,
    #c000ff 75%,
    #ff00c0 100%
  );
}

.equalizer-bar:nth-child(12),
.equalizer-bar:nth-child(13),
.equalizer-bar:nth-child(14),
.equalizer-bar:nth-child(15),
.equalizer-bar:nth-child(16) {
  background: linear-gradient(
    to top,
    #8000ff 0%,
    #c000ff 25%,
    #ff00ff 50%,
    #ff0080 75%,
    #ff4080 100%
  );
}

.play-controls-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.control-button {
  border-radius: 50%;
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  color: #1f2937;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover {
  background-color: #e5e7eb;
}

/* 簡單的播放隊列控制區樣式 */
.playlist-control-panel {
  background-color: #20283d;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.playlist-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dropdown-wrapper {
  position: relative;
}

.genre-btn-simple {
  background-color: #1d4ed8;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  min-width: 100px;
}

.genre-btn-simple:hover {
  background-color: #2563eb;
}

.number-btn-simple {
  background-color: #d97706;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  min-width: 60px;
}

.number-btn-simple:hover {
  background-color: #f59e0b;
}

.play-btn-simple {
  background-color: #f59e0b;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.play-btn-simple:hover {
  background-color: #10b981;
}

.dropdown-simple {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 120px;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 10px 15px;
  cursor: pointer;
  color: #333;
  border-bottom: 1px solid #eee;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.plus-sign {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.playlist-status {
  text-align: center;
  color: white;
  margin-top: 15px;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 5px;
}

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

.heart-outline {
  color: #a2a3a3 !important;
  -webkit-text-stroke: 0 #758094;
  text-stroke: 0 #164392;
}

.heart-outline:hover {
  -webkit-text-stroke: 1.5px #2661d6;
  text-stroke: 1.5px #079125;
}

.heart-filled {
  color: #ec4899 !important;
  -webkit-text-stroke: 0;
  text-stroke: 0;
  filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.3));
}

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
  
  .w-64 { 
    width: 12rem; 
  }
  
  .play-controls-container {
    gap: 20px;
  }
  
  .control-button {
    width: 40px;
    height: 40px;
  }
}
</style>