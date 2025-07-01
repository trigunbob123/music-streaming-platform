<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 左側邊欄 -->
    <div class="w-64 sidebar text-white p-4">
      <div class="flex items-center justify-between mb-8">
        <!-- 使用文字 logo 替代圖片 -->
        <div class="flex items-center">
          <img src="@/assets/images/12.png" alt="DDM360" class="h-auto w-25" />

        </div>
        <div class="flex space-x-2">
          <button v-if="!isJamendoConnected && jamendoConfigured" @click="connectJamendo" 
                  class="text-orange-400 hover:text-orange-300 text-sm">
            <font-awesome-icon icon="music" class="mr-1" />
            連接 Jamendo
          </button>
          <button v-else-if="isJamendoConnected" @click="disconnectJamendo" 
                  class="text-orange-400 hover:text-orange-300 text-sm">
            <font-awesome-icon icon="music" class="mr-1" />
            已連接
          </button>
          <span v-else class="text-gray-400 text-xs">
            Jamendo 未配置
          </span>
        </div>
      </div>

      <nav class="space-y-4 mb-8">
        <button @click="setCurrentMode('random')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors"
                :class="{ 'bg-gray-700': currentMode === 'random' }">
          <font-awesome-icon icon="random" class="mr-3" />
          隨機播放
        </button>
        <button @click="setCurrentMode('latest')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors"
                :class="{ 'bg-gray-700': currentMode === 'latest' }">
          <font-awesome-icon icon="music" class="mr-3" />
          最新音樂
        </button>
        <button @click="setCurrentMode('popular')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors"
                :class="{ 'bg-gray-700': currentMode === 'popular' }">
          <font-awesome-icon icon="fire" class="mr-3" />
          熱門歌曲
        </button>
        <button @click="setCurrentMode('favorites')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors"
                :class="{ 'bg-gray-700': currentMode === 'favorites' }">
          <font-awesome-icon icon="heart" class="mr-3" />
          我的收藏
        </button>
      </nav>

      <!-- Jamendo 播放器狀態 -->
      <div v-if="isJamendoConnected" class="mt-auto">
        <div class="bg-orange-900 p-3 rounded-lg">
          <div class="flex items-center text-orange-300 text-sm">
            <font-awesome-icon icon="music" class="mr-2" />
            <span>Jamendo 已連接</span>
          </div>
        </div>
      </div>

      <!-- 錯誤顯示 -->
      <div v-if="lastError" class="mt-4">
        <div class="bg-red-900 p-3 rounded-lg">
          <div class="flex items-center text-red-300 text-sm">
            <font-awesome-icon icon="exclamation-triangle" class="mr-2" />
            <span>{{ lastError }}</span>
          </div>
          <button @click="clearError" class="text-red-200 text-xs mt-1 underline">
            清除錯誤
          </button>
        </div>
      </div>
    </div>

    <!-- 主要內容區域 -->
    <div class="flex-1 main-content">
      <!-- 頂部播放器 -->
      <div class="bg-gray-800 p-6 text-white">
        <div class="flex items-center justify-between">
          <!-- 左側：當前播放歌曲 -->
          <div class="flex items-center min-w-0 flex-1" v-if="currentTrack.name">
            <!-- 封面 -->
            <div class="w-20 h-20 rounded-lg mr-4 overflow-hidden flex-shrink-0">
              <img v-if="currentTrack.image" 
                   :src="currentTrack.image" 
                   :alt="currentTrack.name" 
                   class="w-full h-full object-cover"
                   @error="handleImageError" />
              <div v-else class="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <font-awesome-icon icon="music" class="text-white text-2xl" />
              </div>
            </div>
            <!-- 歌曲信息 -->
            <div class="min-w-0 flex-1">
              <p class="font-medium text-lg truncate" :title="currentTrack.name">{{ currentTrack.name }}</p>
              <p class="text-sm text-gray-300 truncate" :title="currentTrack.artist_name">
                {{ currentTrack.artist_name }}
              </p>
              <p class="text-xs text-orange-400 truncate" v-if="currentTrack.album_name" :title="currentTrack.album_name">
                {{ currentTrack.album_name }}
              </p>
            </div>
          </div>
          <div v-else class="flex items-center min-w-0 flex-1">
            <div class="text-gray-400 text-sm">
              <font-awesome-icon icon="music" class="mr-2" />
              選擇一首歌曲開始播放
            </div>
          </div>

          <!-- 右側：播放控制和音量 -->
          <div class="flex items-center space-x-4 flex-shrink-0">
            <!-- 改進的音頻均衡器視覺效果 -->
            <div class="audio-visualizer">
              <div class="equalizer-bars">
                <div 
                  v-for="i in 16" 
                  :key="i" 
                  class="equalizer-bar"
                  :ref="el => { if (el) equalizerBars[i-1] = el }"
                  :data-freq-group="getFrequencyGroup(i-1)"
                ></div>
              </div>
            </div>
            
            <!-- 播放控制按鈕 -->
            <div class="play-controls-container">
              <button @click="handlePreviousTrack" class="control-button" :disabled="!currentTrack.name">
                <font-awesome-icon icon="step-backward" class="text-lg" />
              </button>
              <button @click="handleTogglePlay" class="control-button" :disabled="!currentTrack.name">
                <font-awesome-icon :icon="isPlaying ? 'pause' : 'play'" class="text-lg" />
              </button>
              <button @click="handleNextTrack" class="control-button" :disabled="!currentTrack.name">
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
                      :class="{ 'text-orange-400': isShuffled }">
                <font-awesome-icon icon="random" class="text-lg" />
              </button>
              <button @click="toggleRepeat" class="btn btn-circle bg-transparent text-white hover:bg-gray-700"
                      :class="{ 'text-orange-400': repeatMode !== 'off' }">
                <font-awesome-icon :icon="repeatMode === 'one' ? 'redo' : 'repeat'" class="text-lg" />
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
      <div class="p-2 pb-0" v-if="isJamendoConnected">
        <div class="relative inline-block w-full">
          <input v-model="searchQuery" @input="debouncedSearch" 
                 placeholder="🔎搜尋歌曲、藝人或專輯..." 
                 class="w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
      </div>

      <!-- 主要內容 -->
      <div class="p-6">
        <!-- Jamendo 曲風按鈕 - 使用官方推薦的10個曲風 -->
        <div v-if="isJamendoConnected && currentMode !== 'favorites'">
          <div class="grid grid-cols-5 gap-4 mb-4">
            <button v-for="tag in jamendoTags.slice(0, 5)" :key="tag" 
                    @click="searchByTag(tag)"
                    class="genre-btn-new py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                    :class="getGenreButtonClass(tag)">
              {{ getGenreDisplayName(tag) }}
            </button>
          </div>
          <div class="grid grid-cols-5 gap-4 mb-8">
            <button v-for="tag in jamendoTags.slice(5, 10)" :key="tag" 
                    @click="searchByTag(tag)"
                    class="genre-btn-new py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                    :class="getGenreButtonClass(tag)">
              {{ getGenreDisplayName(tag) }}
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
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span class="ml-3 text-lg">載入中...</span>
        </div>

        <!-- 音樂卡片 -->
        <div class="grid grid-cols-6 gap-4">
          <div v-for="track in displayedTracks" :key="track.id" 
               class="music-card bg-white rounded-lg p-3 shadow-md hover:shadow-lg cursor-pointer border relative"
               :class="{ 'ring-2 ring-orange-500': currentTrack.id === track.id }">
            
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
                 @click="handleTrackClick(track)">
              <img v-if="track.image" 
                   :src="track.image" 
                   :alt="track.name" 
                   class="w-full h-full object-cover"
                   @error="handleImageError" />
              <div v-else class="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <font-awesome-icon icon="music" class="text-white text-2xl" />
              </div>
              
              <!-- 播放指示器 -->
              <div v-if="currentTrack.id === track.id && isPlaying" 
                   class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div class="bg-orange-500 text-white rounded-full p-2 animate-pulse">
                  <font-awesome-icon icon="play" class="text-sm" />
                </div>
              </div>
            </div>
            
            <!-- 歌曲信息 -->
            <div @click="handleTrackClick(track)" class="cursor-pointer">
              <h3 class="font-bold text-sm text-gray-800 truncate mb-1" :title="track.name">
                {{ track.name }}
              </h3>
              <p class="text-xs text-gray-600 truncate mb-1" :title="track.artist_name">
                {{ track.artist_name }}
              </p>
              <p class="text-xs text-gray-500 truncate mb-2" v-if="track.album_name" :title="track.album_name">
                {{ track.album_name }}
              </p>
              
              <!-- 底部信息 -->
              <div class="flex justify-between items-center text-xs">
                <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Jamendo</span>
                <span class="text-gray-500" v-if="track.duration">
                  {{ formatTime(track.duration) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 未連接 Jamendo 提示 -->
          <div v-if="!isJamendoConnected && jamendoConfigured" class="col-span-6 text-center py-16 text-gray-500">
            <font-awesome-icon icon="music" class="text-6xl mb-4 text-orange-400" />
            <h3 class="text-xl font-medium mb-2">連接 Jamendo</h3>
            <p class="text-sm mb-4">連接 Jamendo 來播放免費的 Creative Commons 音樂</p>
            <button @click="connectJamendo" class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              <font-awesome-icon icon="music" class="mr-2" />
              連接 Jamendo
            </button>
          </div>

          <!-- Jamendo 未配置提示 -->
          <div v-else-if="!jamendoConfigured" class="col-span-6 text-center py-16 text-gray-500">
            <font-awesome-icon icon="music" class="text-6xl mb-4 text-gray-400" />
            <h3 class="text-xl font-medium mb-2">Jamendo 未配置</h3>
            <p class="text-sm mb-4">請在環境變數中設置 VITE_JAMENDO_CLIENT_ID</p>
          </div>
          
          <!-- 無歌曲提示 -->
          <div v-else-if="!loading && displayedTracks.length === 0" 
               class="col-span-6 text-center py-16 text-gray-500">
            <font-awesome-icon :icon="currentMode === 'favorites' ? 'heart' : 'search'" class="text-6xl mb-4 text-gray-300" />
            <h3 class="text-xl font-medium mb-2">
              {{ currentMode === 'favorites' ? '還沒有收藏' : '搜尋音樂' }}
            </h3>
            <p class="text-sm">
              {{ currentMode === 'favorites' ? '點擊歌曲右上角的愛心來收藏音樂' : '使用上方搜尋欄或點擊標籤按鈕來尋找音樂' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useJamendo } from './composables/useJamendo'

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

// 收藏功能
const favoriteTrackIds = ref(new Set())
const favoriteTracks = ref([])

// 追蹤當前選中的標籤
const selectedTag = ref('')

// 🎵 Jamendo API 官方推薦的10個曲風（替換原有的 Spotify 曲風）
const jamendoTags = ref([
  'pop',        // 流行音樂
  'rock',       // 搖滾音樂  
  'electronic', // 電子音樂
  'jazz',       // 爵士音樂
  'classical',  // 古典音樂
  'hiphop',     // 嘻哈音樂
  'metal',      // 金屬音樂
  'world',      // 世界音樂
  'soundtrack', // 配樂音樂
  'lounge'      // 休閒音樂
])

// 🎵 曲風名稱中英對照（顯示用）
const genreNameMap = {
  'pop': 'POP',
  'rock': 'ROCK', 
  'electronic': 'ELECTRONIC',
  'jazz': 'JAZZ',
  'classical': 'CLASSICAL',
  'hiphop': 'HIP HOP',
  'metal': 'METAL',
  'world': 'WORLD',
  'soundtrack': 'SOUNDTRACK',
  'lounge': 'LOUNGE'
}

// 音頻均衡器相關
const equalizerBars = ref([])
const audioFrequencyData = ref(Array(16).fill(0.2))

// 搜尋防抖
let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchTracks()
  }, 500)
}

// 錯誤處理
const clearError = () => {
  lastError.value = ''
}

// 圖片錯誤處理
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 🎵 新增：曲風按鈕樣式控制
const getGenreButtonClass = (tag) => {
  if (selectedTag.value === tag) {
    // 選中狀態：粉紅色背景，白色文字
    return 'bg-pink-500 text-white font-semibold shadow-lg hover:bg-pink-600'
  } else {
    // 未選中狀態：白色背景，黑色文字
    return 'bg-white text-black font-medium shadow-md border border-gray-200 hover:bg-gray-50'
  }
}

// 🎵 新增：獲取曲風顯示名稱
const getGenreDisplayName = (tag) => {
  return genreNameMap[tag] || tag.toUpperCase()
}

// 🎵 新增：獲取頻率組（低音、中音、高音）
const getFrequencyGroup = (index) => {
  if (index < 5) return 'bass'      // 低音: 0-4
  if (index < 11) return 'mid'      // 中音: 5-10
  return 'high'                     // 高音: 11-15
}

// 🎵 改進的音頻均衡器動態效果
const simulateRealisticAudioSpectrum = () => {
  if (!isPlaying.value) {
    // 音樂停止時緩慢降低所有條形
    audioFrequencyData.value = audioFrequencyData.value.map(value => 
      Math.max(0.1, value * 0.95)
    )
    updateEqualizerBars()
    return
  }
  
  const currentTimeMs = Date.now()
  const beatPeriod = 600 // 主要節拍週期
  const beatPhase = (currentTimeMs % beatPeriod) / beatPeriod
  
  // 計算主要節拍強度
  const beatIntensity = Math.max(0, Math.sin(beatPhase * Math.PI * 2))
  
  // 為不同頻率組創建不同的模式
  audioFrequencyData.value = audioFrequencyData.value.map((currentValue, index) => {
    const freqGroup = getFrequencyGroup(index)
    let newValue = currentValue
    
    if (freqGroup === 'bass') {
      // 低音：跟隨主要節拍，變化較慢但幅度大
      const bassPattern = beatIntensity * (0.8 + Math.sin(currentTimeMs * 0.003 + index) * 0.2)
      const bassRandom = 0.7 + Math.random() * 0.3
      newValue = bassPattern * bassRandom
      
      // 在節拍點有額外的衝擊
      if (beatPhase < 0.1) {
        newValue = Math.min(1.0, newValue * 1.5)
      }
      
    } else if (freqGroup === 'mid') {
      // 中音：較複雜的模式，有時跟隨人聲和樂器
      const midBase = Math.sin(currentTimeMs * 0.005 + index * 0.8) * 0.4 + 0.5
      const midRhythm = Math.sin(beatPhase * Math.PI * 3) * 0.3 // 更快的節拍
      const midRandom = 0.6 + Math.random() * 0.4
      newValue = (midBase + midRhythm) * midRandom
      
    } else { // high
      // 高音：快速變化，模擬高帽、鈸等
      const highFreq = Math.sin(currentTimeMs * 0.008 + index * 1.5) * 0.5 + 0.4
      const highSpikes = Math.random() > 0.8 ? Math.random() * 0.6 : 0 // 隨機尖峰
      const highRandom = 0.5 + Math.random() * 0.5
      newValue = (highFreq + highSpikes) * highRandom
      
      // 在某些節拍點有鈸的效果
      if (beatPhase > 0.7 && beatPhase < 0.9 && Math.random() > 0.7) {
        newValue = Math.min(1.0, newValue * 2)
      }
    }
    
    // 平滑過渡
    const smoothing = freqGroup === 'bass' ? 0.8 : freqGroup === 'mid' ? 0.7 : 0.6
    return currentValue * smoothing + newValue * (1 - smoothing)
  })
  
  updateEqualizerBars()
}

// 🎵 更新均衡器條形顯示
const updateEqualizerBars = () => {
  equalizerBars.value.forEach((bar, index) => {
    if (!bar) return
    
    const intensity = audioFrequencyData.value[index]
    const height = Math.max(8, Math.min(90, intensity * 100))
    const freqGroup = getFrequencyGroup(index)
    
    // 設置高度
    bar.style.height = `${height}%`
    
    // 根據頻率組和強度設置顏色
    if (intensity > 0.8) {
      // 高強度：亮色
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #ff4500, #ff6347, #ffa500)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #ffa500, #ffff00, #adff2f)'
      } else {
        bar.style.background = 'linear-gradient(to top, #ffff00, #ffffff, #87ceeb)'
      }
      bar.style.boxShadow = `0 0 ${intensity * 10}px rgba(255, 165, 0, ${intensity * 0.8})`
    } else if (intensity > 0.5) {
      // 中等強度：標準色
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #ff6b35, #ff8c42, #ffa449)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #f7931e, #ffab00, #ffc107)'
      } else {
        bar.style.background = 'linear-gradient(to top, #ffcc02, #ffeb3b, #fff200)'
      }
      bar.style.boxShadow = `0 0 ${intensity * 6}px rgba(255, 140, 0, ${intensity * 0.5})`
    } else {
      // 低強度：暗色
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #8b4513, #cd853f)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #daa520, #f0e68c)'
      } else {
        bar.style.background = 'linear-gradient(to top, #f0e68c, #ffffe0)'
      }
      bar.style.boxShadow = 'none'
    }
    
    // 添加頻率組特定的效果
    if (freqGroup === 'bass') {
      bar.style.filter = `saturate(${1 + intensity * 0.5})`
    } else if (freqGroup === 'high') {
      bar.style.filter = `brightness(${1 + intensity * 0.3}) contrast(${1 + intensity * 0.2})`
    } else {
      bar.style.filter = `hue-rotate(${intensity * 20}deg)`
    }
  })
}

// 🎵 均衡器動畫控制
let equalizerInterval = null
const startEqualizerAnimation = () => {
  if (equalizerInterval) clearInterval(equalizerInterval)
  equalizerInterval = setInterval(simulateRealisticAudioSpectrum, 80) // 12.5 FPS
}

const stopEqualizerAnimation = () => {
  if (equalizerInterval) {
    clearInterval(equalizerInterval)
    equalizerInterval = null
  }
  
  // 緩慢淡出效果
  const fadeOut = () => {
    audioFrequencyData.value = audioFrequencyData.value.map(value => value * 0.9)
    updateEqualizerBars()
    
    if (Math.max(...audioFrequencyData.value) > 0.05) {
      setTimeout(fadeOut, 50)
    } else {
      // 設置為最小值
      audioFrequencyData.value.fill(0.1)
      equalizerBars.value.forEach(bar => {
        if (bar) {
          bar.style.height = '8%'
          bar.style.boxShadow = 'none'
          bar.style.filter = 'none'
          bar.style.background = 'linear-gradient(to top, #666, #999)'
        }
      })
    }
  }
  fadeOut()
}

// 播放控制函數
const handlePreviousTrack = () => {
  console.log('⏮️ 點擊上一首按鈕')
  if (previousTrack && typeof previousTrack === 'function') {
    previousTrack()
  } else {
    console.warn('previousTrack 函數不可用')
  }
}

const handleNextTrack = () => {
  console.log('⏭️ 點擊下一首按鈕') 
  if (nextTrack && typeof nextTrack === 'function') {
    nextTrack()
  } else {
    console.warn('nextTrack 函數不可用')
  }
}

const handleTogglePlay = () => {
  console.log('⏯️ 點擊播放/暫停按鈕')
  if (togglePlay && typeof togglePlay === 'function') {
    togglePlay()
  } else {
    console.warn('togglePlay 函數不可用')
  }
}

// 歌曲點擊處理
const handleTrackClick = async (track) => {
  try {
    console.log('🎵 點擊歌曲:', track.name)
    await playTrack(track)
  } catch (error) {
    console.error('❌ 播放歌曲失敗:', error)
    alert('播放失敗: ' + error.message)
  }
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
  if (!searchQuery.value.trim() || !isJamendoConnected.value) return
  
  loading.value = true
  selectedTag.value = '' // 清除選中的標籤
  
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

// 按標籤搜尋
const searchByTag = async (tag) => {
  selectedTag.value = tag
  searchQuery.value = '' // 清除搜尋框
  
  loading.value = true
  try {
    if (getTracksByTag && typeof getTracksByTag === 'function') {
      const results = await getTracksByTag(tag, { limit: 30 })
      displayedTracks.value = results
      console.log(`🎵 搜尋 ${getGenreDisplayName(tag)} 曲風，找到 ${results.length} 首歌曲`)
    }
  } catch (error) {
    console.error('標籤搜尋失敗:', error)
  } finally {
    loading.value = false
  }
}

// 設置模式
const setCurrentMode = async (mode) => {
  currentMode.value = mode
  selectedTag.value = '' // 清除選中的標籤
  searchQuery.value = '' // 清除搜尋框
  
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

// 監聽播放狀態變化 - 控制均衡器
watch(isPlaying, (playing) => {
  if (playing) {
    startEqualizerAnimation()
  } else {
    stopEqualizerAnimation()
  }
}, { immediate: true })

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
  
  // 等待 Jamendo 連接後再載入數據
  if (isJamendoConnected.value && currentMode.value !== 'favorites') {
    await setCurrentMode('popular')
  }
  
  // 初始化均衡器
  setTimeout(() => {
    if (isPlaying.value) {
      startEqualizerAnimation()
    }
  }, 500)
})

// 清理資源
onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (equalizerInterval) {
    clearInterval(equalizerInterval)
  }
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
  background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* 🎵 改進的音頻均衡器視覺效果 */
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
  height: 8%;
  background: linear-gradient(to top, #666, #999);
  border-radius: 3px;
  transition: height 0.08s ease-out, background 0.1s ease, box-shadow 0.1s ease, filter 0.1s ease;
  position: relative;
}

/* 低音條（0-4）*/
.equalizer-bar[data-freq-group="bass"] {
  background: linear-gradient(to top, #ff6b35 0%, #ff8c42 50%, #ffa449 100%);
}

/* 中音條（5-10）*/
.equalizer-bar[data-freq-group="mid"] {
  background: linear-gradient(to top, #f7931e 0%, #ffab00 50%, #ffc107 100%);
}

/* 高音條（11-15）*/
.equalizer-bar[data-freq-group="high"] {
  background: linear-gradient(to top, #ffcc02 0%, #ffeb3b 50%, #fff200 100%);
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

.control-button:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: #f97316;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f97316;
  cursor: pointer;
  border: none;
}

/* 🎵 新的曲風按鈕樣式 */
.genre-btn-new {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.genre-btn-new:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px) scale(1.05);
}

/* 未選中狀態：白色背景，黑色文字 */
.genre-btn-new.bg-white {
  background-color: white;
  color: black;
}

.genre-btn-new.bg-white:hover {
  background-color: #f9fafb;
}

/* 選中狀態：粉紅色背景，白色文字 */
.genre-btn-new.bg-pink-500 {
  background-color: #ec4899;
  color: white;
}

.genre-btn-new.bg-pink-500:hover {
  background-color: #db2777;
}

.heart-outline {
  color: #a2a3a3 !important;
}

.heart-outline:hover {
  color: #6b7280 !important;
}

.heart-filled {
  color: #ec4899 !important;
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
    gap: 10px;
  }
  
  .control-button {
    width: 40px;
    height: 40px;
  }
}
</style>