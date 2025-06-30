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
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
                :class="{ 'bg-gray-700': currentMode === 'random' }">
          <font-awesome-icon icon="random" class="mr-3" />
          隨機播放
        </button>
        <button @click="setCurrentMode('latest')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
                :class="{ 'bg-gray-700': currentMode === 'latest' }">
          <font-awesome-icon icon="music" class="mr-3" />
          最新音樂
        </button>
        <button @click="setCurrentMode('popular')" 
                class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
                :class="{ 'bg-gray-700': currentMode === 'popular' }">
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

      <!-- Jamendo 播放器狀態 -->
      <div v-if="isJamendoConnected" class="mt-auto">
        <div class="bg-orange-900 p-3 rounded-lg">
          <div class="flex items-center text-orange-300 text-sm">
            <font-awesome-icon icon="music" class="mr-2" />
            <span>Jamendo 已連接</span>
          </div>
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
                   class="w-full h-full object-cover" />
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

          <!-- 右側：播放控制和音量 -->
          <div class="flex items-center space-x-4 flex-shrink-0">
            <!-- 音頻均衡器視覺效果 -->
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
          <input v-model="searchQuery" @input="searchTracks" 
                 placeholder="🔎搜尋歌曲、藝人或專輯..." 
                 class="w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
      </div>

      <!-- 主要內容 -->
      <div class="p-6">
        <!-- 自定義播放隊列控制區 -->
        <div class="playlist-control-panel" v-if="isJamendoConnected">
          <div class="playlist-header">
            <h3 class="text-white text-lg font-bold mb-4">🎵 自定義播放隊列</h3>
            <p class="text-gray-300 text-sm mb-4">設定三組標籤和數量，系統將按順序播放</p>
          </div>
          
          <div class="playlist-controls">
            <!-- 第一組 -->
            <div class="control-group">
              <span class="group-label">第1組</span>
              <div class="dropdown-wrapper">
                <button class="genre-btn-simple" @click="toggleTagDropdown(0)">
                  {{ playlistConfig[0].tag }} ▼
                </button>
                <div v-if="tagDropdownOpen[0]" class="dropdown-simple">
                  <div v-for="tag in availableTags" :key="tag" 
                       @click="selectTag(0, tag)" class="dropdown-item">
                    {{ tag }}
                  </div>
                </div>
              </div>
              <div class="dropdown-wrapper">
                <button class="number-btn-simple" @click="toggleNumberDropdown(0)">
                  {{ playlistConfig[0].count }} 首 ▼
                </button>
                <div v-if="numberDropdownOpen[0]" class="dropdown-simple">
                  <div v-for="num in [1,2,3,4,5,6,7,8,9,10]" :key="num" 
                       @click="selectNumber(0, num)" class="dropdown-item">
                    {{ num }} 首
                  </div>
                </div>
              </div>
            </div>

            <span class="plus-sign">→</span>

            <!-- 第二組 -->
            <div class="control-group">
              <span class="group-label">第2組</span>
              <div class="dropdown-wrapper">
                <button class="genre-btn-simple" @click="toggleTagDropdown(1)">
                  {{ playlistConfig[1].tag }} ▼
                </button>
                <div v-if="tagDropdownOpen[1]" class="dropdown-simple">
                  <div v-for="tag in availableTags" :key="tag" 
                       @click="selectTag(1, tag)" class="dropdown-item">
                    {{ tag }}
                  </div>
                </div>
              </div>
              <div class="dropdown-wrapper">
                <button class="number-btn-simple" @click="toggleNumberDropdown(1)">
                  {{ playlistConfig[1].count }} 首 ▼
                </button>
                <div v-if="numberDropdownOpen[1]" class="dropdown-simple">
                  <div v-for="num in [1,2,3,4,5,6,7,8,9,10]" :key="num" 
                       @click="selectNumber(1, num)" class="dropdown-item">
                    {{ num }} 首
                  </div>
                </div>
              </div>
            </div>

            <span class="plus-sign">→</span>

            <!-- 第三組 -->
            <div class="control-group">
              <span class="group-label">第3組</span>
              <div class="dropdown-wrapper">
                <button class="genre-btn-simple" @click="toggleTagDropdown(2)">
                  {{ playlistConfig[2].tag }} ▼
                </button>
                <div v-if="tagDropdownOpen[2]" class="dropdown-simple">
                  <div v-for="tag in availableTags" :key="tag" 
                       @click="selectTag(2, tag)" class="dropdown-item">
                    {{ tag }}
                  </div>
                </div>
              </div>
              <div class="dropdown-wrapper">
                <button class="number-btn-simple" @click="toggleNumberDropdown(2)">
                  {{ playlistConfig[2].count }} 首 ▼
                </button>
                <div v-if="numberDropdownOpen[2]" class="dropdown-simple">
                  <div v-for="num in [1,2,3,4,5,6,7,8,9,10]" :key="num" 
                       @click="selectNumber(2, num)" class="dropdown-item">
                    {{ num }} 首
                  </div>
                </div>
              </div>
            </div>

            <!-- 播放按鈕 -->
            <button class="play-btn-simple" @click="startCustomPlaylist" :disabled="loading">
              <span v-if="loading">
                <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                建立中...
              </span>
              <span v-else>
                ▶ 開始播放
              </span>
            </button>
          </div>
          
          <!-- 播放狀態顯示 -->
          <div v-if="customPlaylistActive" class="playlist-status">
            <div class="status-header">
              <span class="status-badge">🎵 正在播放自定義隊列</span>
              <button @click="stopCustomPlaylist" class="stop-btn">
                ⏹ 停止
              </button>
            </div>
            <div class="status-details">
              {{ currentPlaylistStatus }}
            </div>
            <!-- 播放進度條 -->
            <div class="playlist-progress">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" 
                     :style="{ width: playlistProgressPercent + '%' }"></div>
              </div>
              <span class="progress-text">
                {{ (currentTrackIndex || 0) + 1 }} / {{ totalPlaylistTracks }} 首
              </span>
            </div>
          </div>
        </div>

        <!-- 標籤按鈕 -->
        <div v-if="isJamendoConnected && currentMode !== 'favorites'">
          <div class="grid grid-cols-5 gap-4 mb-4">
            <button v-for="tag in jamendoTags.slice(0, 5)" :key="tag" 
                    @click="searchByTag(tag)"
                    class="genre-btn py-3 px-6 rounded-lg text-white hover:bg-orange-400 transition-all duration-300 transform hover:scale-105"
                    :class="selectedTag === tag ? 'bg-orange-500' : 'bg-orange-600'">
              {{ tag.toUpperCase() }}
            </button>
          </div>
          <div class="grid grid-cols-5 gap-4 mb-8">
            <button v-for="tag in jamendoTags.slice(5, 10)" :key="tag" 
                    @click="searchByTag(tag)"
                    class="genre-btn py-3 px-6 rounded-lg text-white hover:bg-orange-400 transition-all duration-300 transform hover:scale-105"
                    :class="selectedTag === tag ? 'bg-orange-500' : 'bg-orange-600'">
              {{ tag.toUpperCase() }}
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
                   class="w-full h-full object-cover" />
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
    playNextInPlaylist: () => Promise.resolve()
  }
}

const {
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
  playNextInPlaylist
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

// 檢查 Jamendo 是否已配置
const jamendoConfigured = computed(() => {
  try {
    return !!import.meta.env.VITE_JAMENDO_CLIENT_ID
  } catch (error) {
    return false
  }
})

// Jamendo 標籤（相當於曲風）
const jamendoTags = ref([
  'pop', 'rock', 'electronic', 'jazz', 'classical', 
  'folk', 'metal', 'reggae', 'blues', 'ambient'
])

// 自定義播放隊列功能
const availableTags = ref(['pop', 'rock', 'electronic', 'jazz', 'classical', 'folk', 'metal', 'reggae', 'blues', 'ambient', 'world', 'experimental', 'instrumental', 'vocal', 'acoustic'])

// 播放隊列配置
const playlistConfig = ref([
  { tag: 'pop', count: 3 },
  { tag: 'rock', count: 2 },
  { tag: 'jazz', count: 1 }
])

// 下拉選單狀態
const tagDropdownOpen = ref([false, false, false])
const numberDropdownOpen = ref([false, false, false])

// 自定義播放隊列狀態
const customPlaylistActive = ref(false)
const customPlaylistQueue = ref([])
const customPlaylistIndex = ref(0)
const currentPlaylistStatus = ref('')

// 播放隊列進度
const totalPlaylistTracks = computed(() => {
  return playlistConfig.value.reduce((total, config) => total + config.count, 0)
})

const playlistProgressPercent = computed(() => {
  if (!customPlaylistActive.value || totalPlaylistTracks.value === 0) return 0
  const currentIndex = currentTrackIndex.value || 0
  return ((currentIndex + 1) / customPlaylistQueue.value.length) * 100
})

// 下拉選單控制函數
const toggleTagDropdown = (index) => {
  tagDropdownOpen.value = tagDropdownOpen.value.map((_, i) => i === index ? !tagDropdownOpen.value[i] : false)
  numberDropdownOpen.value = [false, false, false]
}

const toggleNumberDropdown = (index) => {
  numberDropdownOpen.value = numberDropdownOpen.value.map((_, i) => i === index ? !numberDropdownOpen.value[i] : false)
  tagDropdownOpen.value = [false, false, false]
}

const selectTag = (index, tag) => {
  playlistConfig.value[index].tag = tag
  tagDropdownOpen.value[index] = false
  console.log(`✅ 第${index + 1}組標籤設定為: ${tag}`)
}

const selectNumber = (index, number) => {
  playlistConfig.value[index].count = number
  numberDropdownOpen.value[index] = false
  console.log(`✅ 第${index + 1}組數量設定為: ${number} 首`)
}

// 自定義播放隊列建立
const startCustomPlaylist = async () => {
  try {
    loading.value = true
    customPlaylistActive.value = false
    customPlaylistQueue.value = []
    customPlaylistIndex.value = 0
    
    console.log('🎵 開始建立自定義播放隊列...')
    console.log('📋 播放配置:', playlistConfig.value)
    
    // 按順序建立播放隊列
    for (let groupIndex = 0; groupIndex < playlistConfig.value.length; groupIndex++) {
      const config = playlistConfig.value[groupIndex]
      console.log(`📀 第${groupIndex + 1}組：獲取 ${config.tag} 標籤的 ${config.count} 首歌曲...`)
      
      try {
        const tagTracks = await getTracksByTag(config.tag, { limit: config.count * 3 })
        
        if (tagTracks.length > 0) {
          // 隨機選擇歌曲但保持設定的數量
          const shuffledTracks = [...tagTracks].sort(() => Math.random() - 0.5)
          const selectedTracks = shuffledTracks.slice(0, config.count)
          
          // 為每首歌添加組別和位置信息
          selectedTracks.forEach((track, trackIndex) => {
            customPlaylistQueue.value.push({
              ...track,
              tagGroup: groupIndex,
              tagName: config.tag,
              trackIndexInGroup: trackIndex,
              totalInGroup: config.count,
              globalIndex: customPlaylistQueue.value.length
            })
          })
          
          console.log(`✅ 第${groupIndex + 1}組 ${config.tag}: 已添加 ${selectedTracks.length} 首歌曲`)
          console.log(`🎵 歌曲列表:`, selectedTracks.map(t => `${t.name} - ${t.artist_name}`))
        } else {
          console.warn(`⚠️ 第${groupIndex + 1}組 ${config.tag}: 找不到歌曲`)
        }
      } catch (error) {
        console.error(`❌ 獲取第${groupIndex + 1}組 ${config.tag} 歌曲失敗:`, error)
      }
    }
    
    console.log('🎵 播放隊列建立完成')
    console.log('📊 統計:', {
      totalTracks: customPlaylistQueue.value.length,
      targetTracks: totalPlaylistTracks.value,
      queue: customPlaylistQueue.value.map(t => `${t.tagName}-${t.name}`)
    })
    
    if (customPlaylistQueue.value.length > 0) {
      // 設置播放列表
      console.log('🎵 設置播放列表...')
      setPlaylist(customPlaylistQueue.value, 0)
      
      // 開始播放第一首歌
      console.log('🎵 開始播放第一首:', customPlaylistQueue.value[0].name)
      await playTrack(customPlaylistQueue.value[0], customPlaylistQueue.value, 0)
      
      // 啟用自定義播放隊列狀態
      customPlaylistActive.value = true
      updatePlaylistStatus()
      
      console.log('✅ 自定義播放隊列啟動成功')
    } else {
      alert('無法建立播放隊列，請檢查網路連接或重試')
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

// 停止自定義播放隊列
const stopCustomPlaylist = () => {
  console.log('🛑 停止自定義播放隊列')
  customPlaylistActive.value = false
  customPlaylistQueue.value = []
  customPlaylistIndex.value = 0
  currentPlaylistStatus.value = ''
  
  // 清除播放列表
  clearPlaylist()
  
  console.log('✅ 自定義播放隊列已停止')
}

// 更新播放狀態顯示
const updatePlaylistStatus = () => {
  if (!customPlaylistActive.value || customPlaylistQueue.value.length === 0) {
    currentPlaylistStatus.value = ''
    return
  }
  
  const currentIndex = currentTrackIndex.value || 0
  const currentTrackInQueue = customPlaylistQueue.value[currentIndex]
  
  if (currentTrackInQueue) {
    const groupNumber = currentTrackInQueue.tagGroup + 1
    const trackInGroup = currentTrackInQueue.trackIndexInGroup + 1
    const totalInGroup = currentTrackInQueue.totalInGroup
    const overallProgress = `${currentIndex + 1}/${customPlaylistQueue.value.length}`
    
    currentPlaylistStatus.value = `正在播放：第${groupNumber}組 ${currentTrackInQueue.tagName} (${trackInGroup}/${totalInGroup}) | 總進度: ${overallProgress}`
    
    customPlaylistIndex.value = currentIndex
  }
}

// 監聽播放隊列變化來更新狀態
watch([currentTrackIndex, currentTrack], () => {
  if (customPlaylistActive.value) {
    updatePlaylistStatus()
  }
})

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
    
    // 如果正在使用自定義播放隊列，停止它
    if (customPlaylistActive.value) {
      console.log('🛑 停止自定義播放隊列，播放單首歌曲')
      stopCustomPlaylist()
    }
    
    // 播放單首歌曲（不設置播放列表）
    await playTrack(track)
    
  } catch (error) {
    console.error('❌ 播放歌曲失敗:', error)
    alert('播放失敗: ' + error.message)
  }
}

// 點擊外部關閉下拉選單
const closeAllDropdowns = () => {
  tagDropdownOpen.value = [false, false, false]
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
  if (!searchQuery.value.trim() || !isJamendoConnected.value) return
  
  // 如果正在使用自定義播放隊列，停止它
  if (customPlaylistActive.value) {
    stopCustomPlaylist()
  }
  
  loading.value = true
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
  
  // 如果正在使用自定義播放隊列，停止它
  if (customPlaylistActive.value) {
    stopCustomPlaylist()
  }
  
  loading.value = true
  try {
    if (getTracksByTag && typeof getTracksByTag === 'function') {
      const results = await getTracksByTag(tag, { limit: 30 })
      displayedTracks.value = results
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
  
  // 如果切換到其他模式，停止自定義播放隊列
  if (customPlaylistActive.value) {
    stopCustomPlaylist()
  }
  
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
        0 0 ${glowIntensity * 8}px rgba(255, 165, 0, ${glowIntensity * 0.6}),
        0 0 ${glowIntensity * 15}px rgba(255, 69, 0, ${glowIntensity * 0.3})
      `
    } else if (intensity > 0.5) {
      const midGlow = (intensity - 0.5) / 0.2
      bar.style.boxShadow = `0 0 ${midGlow * 4}px rgba(255, 140, 0, ${midGlow * 0.4})`
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

// 監聽 Jamendo 連接狀態
watch(isJamendoConnected, async (connected) => {
  if (connected && currentMode.value !== 'favorites') {
    await setCurrentMode('popular')
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
  
  if (isJamendoConnected.value && currentMode.value !== 'favorites') {
    await setCurrentMode('popular')
  }
  
  // 確保均衡器初始化
  setTimeout(() => {
    if (isJamendoConnected.value) {
      startEqualizerAnimation()
    }
  }, 500)
})

// 清理資源
onUnmounted(() => {
  if (equalizerInterval) {
    clearInterval(equalizerInterval)
  }
  
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

.btn-circle {
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 音頻均衡器視覺效果 - 橙色主題 */
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
    #ff6b35 0%,
    #f7931e 25%,
    #ffcc02 50%,
    #fff200 75%,
    #ffff00 100%
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
    #ff6b35 0%,
    #ff8c42 30%,
    #ffa449 60%,
    #ffb74d 100%
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
    #f7931e 0%,
    #ffab00 25%,
    #ffc107 50%,
    #ffcc02 75%,
    #ffd54f 100%
  );
}

.equalizer-bar:nth-child(12),
.equalizer-bar:nth-child(13),
.equalizer-bar:nth-child(14),
.equalizer-bar:nth-child(15),
.equalizer-bar:nth-child(16) {
  background: linear-gradient(
    to top,
    #ffcc02 0%,
    #ffeb3b 25%,
    #fff200 50%,
    #ffff00 75%,
    #f4ff81 100%
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

/* 播放隊列控制區樣式 - 橙色主題 */
.playlist-control-panel {
  background: linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%);
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.playlist-header h3 {
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.playlist-header p {
  color: #e5e7eb;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.playlist-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.group-label {
  color: #fbbf24;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-wrapper {
  position: relative;
}

.genre-btn-simple {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  min-width: 120px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
}

.genre-btn-simple:hover {
  background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
}

.number-btn-simple {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  min-width: 80px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.number-btn-simple:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.play-btn-simple {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.3);
  min-width: 140px;
}

.play-btn-simple:hover:not(:disabled) {
  background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(249, 115, 22, 0.4);
}

.play-btn-simple:disabled {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 10px rgba(107, 114, 128, 0.2);
}

.dropdown-simple {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 140px;
  max-height: 250px;
  overflow-y: auto;
  margin-top: 5px;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.2s ease;
  font-weight: 500;
}

.dropdown-item:hover {
  background-color: #f8fafc;
  color: #1f2937;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.plus-sign {
  color: #fbbf24;
  font-size: 24px;
  font-weight: bold;
}

.playlist-status {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-badge {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stop-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.stop-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-1px);
}

.status-details {
  color: #e5e7eb;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 15px;
  line-height: 1.5;
}

.playlist-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-bg {
  flex: 1;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f97316 0%, #ea580c 50%, #fbbf24 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  color: #e5e7eb;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
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
  
  .playlist-controls {
    flex-direction: column;
    gap: 15px;
  }
  
  .control-group {
    flex-direction: row;
    gap: 10px;
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
  
  .playlist-controls {
    gap: 10px;
  }
  
  .genre-btn-simple,
  .number-btn-simple {
    min-width: 100px;
    padding: 10px 12px;
  }
  
  .play-btn-simple {
    min-width: 120px;
    padding: 12px 20px;
  }
}
</style>