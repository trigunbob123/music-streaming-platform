<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 左側邊欄 -->
    <div class="w-64 sidebar text-white p-10">
      <div class="flex items-center justify-between mb-8">
        <!-- 只顯示 logo，移除連接狀態 -->
        <div class="flex items-center">
          <img src="@/assets/images/12.png" alt="DDM360" class="h-auto w-25" />
        </div>
        <!-- 連接按鈕區域 -->
        <div class="flex space-x-2">
          <button v-if="!isJamendoConnected && jamendoConfigured" @click="connectJamendo" 
                  class="text-orange-400 hover:text-orange-300 text-sm">
            <font-awesome-icon icon="music" class="mr-1" />
            連接 Jamendo
          </button>
          <span v-else-if="!jamendoConfigured" class="text-gray-400 text-xs">
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

      <!-- 錯誤顯示區塊已隱藏 -->
      <!-- 
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
      -->
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
            <div class="min-w-0 flex-1 max-w-xs">
              <p class="font-medium text-lg leading-tight max-h-12 overflow-hidden" 
                 :title="currentTrack.name"
                 style="line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                {{ currentTrack.name }}
              </p>
              <p class="text-sm text-gray-300 truncate mt-1" :title="currentTrack.artist_name">
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
            <!-- 載入指示器 -->
            <div v-if="isLoadingTrack" class="flex items-center text-orange-400">
              <font-awesome-icon icon="spinner" class="animate-spin mr-2" />
              <span class="text-sm">載入中...</span>
            </div>
            
            <!-- 改進的音頻均衡器視覺效果 -->
            <div class="audio-visualizer" v-show="!isLoadingTrack">
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
              <button @click="handlePreviousTrack" class="control-button" :disabled="!currentTrack.name || isLoadingTrack">
                <font-awesome-icon icon="step-backward" class="text-lg" />
              </button>
              <button @click="handleTogglePlay" class="control-button" :disabled="!currentTrack.name">
                <font-awesome-icon v-if="isLoadingTrack" icon="spinner" class="text-lg animate-spin" />
                <font-awesome-icon v-else :icon="isPlaying ? 'pause' : 'play'" class="text-lg" />
              </button>
              <button @click="handleNextTrack" class="control-button" :disabled="!currentTrack.name || isLoadingTrack">
                <font-awesome-icon icon="step-forward" class="text-lg" />
              </button>
            </div>
            
            <!-- 進度條區域 -->
            <div class="flex items-center space-x-2" style="min-width: 170px;">
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

      <!-- 搜尋欄和混和曲風播放清單控制 -->
      <div v-if="isJamendoConnected" class="p-2 pb-0 space-y-4">
        <!-- 搜尋欄 -->
        <div class="relative inline-block w-full">
          <input v-model="searchQuery" @input="debouncedSearch" 
                 placeholder="🔎搜尋歌曲、藝人或專輯..." 
                 class="w-full py-1 my-0 px-4 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
 />
        </div>

        <!-- 🆕 修改：音樂播放清單控制 -->
        <div class="p-4 bg-gradient-to-r from-blue-900 to-black-600 rounded-lg">
          <div class="flex items-center space-x-4 flex-wrap">
            <!-- 第一個曲風按鈕組 -->
            <div class="flex items-center space-x-2">
              <div class="relative">
                <button @click="toggleGenreDropdown(0)" 
                        class="genre-selector-btn px-6 py-3 bg-blue-100 text-blue rounded-lg font-semibold hover:bg-blue-300 flex items-center space-x-2 cursor-pointer">
                  <span>{{ playlistConfig[0].genre }}</span>
                  <font-awesome-icon icon="chevron-down" class="text-sm" />
                </button>
                <!-- 🔧 修改：浮動式曲風下拉選單 -->
                <div v-if="genreDropdownOpen[0]" class="floating-dropdown">
                  <div v-for="genre in availableGenres" :key="genre.value" 
                       @click="selectGenre(0, genre)" 
                       class="dropdown-item">
                    {{ genre.label }}
                  </div>
                </div>
              </div>
              <div class="relative">
                <button @click="toggleCountDropdown(0)" 
                        class="count-selector-btn px-4 py-3 bg-blue-300 text-black rounded-lg font-bold hover:bg-blue-100 flex items-center space-x-2 cursor-pointer">
                  <span>{{ playlistConfig[0].count }}</span>
                  <font-awesome-icon icon="chevron-down" class="text-sm" />
                </button>
                <!-- 🔧 修改：浮動式數字下拉選單 -->
                <div v-if="countDropdownOpen[0]" class="floating-dropdown">
                  <div v-for="count in [1, 2, 3, 4, 5]" :key="count" 
                       @click="selectCount(0, count)" 
                       class="dropdown-item">
                    {{ count }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 加號 -->
            <div class="text-white text-2xl font-bold">+</div>

            <!-- 第二個曲風按鈕組 -->
            <div class="flex items-center space-x-2">
              <div class="relative">
                <button @click="toggleGenreDropdown(1)" 
                        class="genre-selector-btn px-6 py-3 bg-blue-100 text-black rounded-lg font-semibold hover:bg-blue-300 flex items-center space-x-2 cursor-pointer">
                  <span>{{ playlistConfig[1].genre }}</span>
                  <font-awesome-icon icon="chevron-down" class="text-sm" />
                </button>
                <div v-if="genreDropdownOpen[1]" class="floating-dropdown">
                  <div v-for="genre in availableGenres" :key="genre.value" 
                       @click="selectGenre(1, genre)" 
                       class="dropdown-item">
                    {{ genre.label }}
                  </div>
                </div>
              </div>
              <div class="relative">
                <button @click="toggleCountDropdown(1)" 
                        class="count-selector-btn px-4 py-3 bg-blue-300 text-black rounded-lg font-bold hover:bg-blue-100 flex items-center space-x-2 cursor-pointer">
                  <span>{{ playlistConfig[1].count }}</span>
                  <font-awesome-icon icon="chevron-down" class="text-sm" />
                </button>
                <div v-if="countDropdownOpen[1]" class="floating-dropdown">
                  <div v-for="count in [1, 2, 3, 4, 5]" :key="count" 
                       @click="selectCount(1, count)" 
                       class="dropdown-item">
                    {{ count }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 加號 -->
            <div class="text-white text-2xl font-bold">+</div>

            <!-- 第三個曲風按鈕組 -->
            <div class="flex items-center space-x-2">
              <div class="relative">
                <button @click="toggleGenreDropdown(2)" 
                        class="genre-selector-btn px-6 py-3 bg-blue-100 text-black rounded-lg font-semibold hover:bg-blue-300 flex items-center space-x-2 cursor-pointer">
                  <span>{{ playlistConfig[2].genre }}</span>
                  <font-awesome-icon icon="chevron-down" class="text-sm" />
                </button>
                <div v-if="genreDropdownOpen[2]" class="floating-dropdown">
                  <div v-for="genre in availableGenres" :key="genre.value" 
                       @click="selectGenre(2, genre)" 
                       class="dropdown-item">
                    {{ genre.label }}
                  </div>
                </div>
              </div>
              <div class="relative">
                <button @click="toggleCountDropdown(2)" 
                        class="count-selector-btn px-4 py-3 bg-blue-300 text-black rounded-lg font-bold hover:bg-blue-100 flex items-center space-x-2 cursor-pointer">
                  <span>{{ playlistConfig[2].count }}</span>
                  <font-awesome-icon icon="chevron-down" class="text-sm" />
                </button>
                <div v-if="countDropdownOpen[2]" class="floating-dropdown">
                  <div v-for="count in [1, 2, 3, 4, 5]" :key="count" 
                       @click="selectCount(2, count)" 
                       class="dropdown-item">
                    {{ count }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 播放按鈕 -->
            <button @click="startCustomPlaylist" 
                    :disabled="isGeneratingPlaylist"
                    class="play-playlist-btn px-6 py-3 bg-orange-400 text-black hover:bg-gray-700 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer">
              <font-awesome-icon v-if="isGeneratingPlaylist" icon="spinner" class="animate-spin" />
              <font-awesome-icon v-else icon="play" />
              <span v-if="isGeneratingPlaylist">生成中...</span>
              <span v-else>播放</span>
            </button>

            <!-- 🆕 新增：混和曲風播放清單狀態顯示 - 移到播放按鈕右邊 -->
            <div v-if="customPlaylistStatus.isActive && currentMode === 'custom'" class="custom-playlist-status bg-blue-900/50 px-4 py-2 rounded-lg">
              <div class="text-xs text-blue-200 mb-1">混和曲風播放清單</div>
              <div class="text-sm font-medium text-white">
                第{{ customPlaylistStatus.currentGroup }}組 {{ customPlaylistStatus.currentGenre }} 
                ({{ customPlaylistStatus.currentInGroup }}/{{ customPlaylistStatus.totalInGroup }})
              </div>
              <div class="text-xs text-blue-300 mt-1">
                總進度: {{ customPlaylistStatus.overallProgress }}/{{ customPlaylistStatus.totalTracks }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主要內容 -->
      <div class="p-6">
        <!-- Jamendo 曲風按鈕 -->
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
          <h2 class="text-2xl font-bold text-gray-300 flex items-center">
            <font-awesome-icon icon="heart" class="mr-2 text-red-500" />
            我的收藏 ({{ favoriteTrackIds.size }} 首)
          </h2>
          <p class="text-gray-300 text-sm mt-1">你收藏的音樂清單</p>
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
              
              <!-- 載入指示器 -->
              <div v-if="currentTrack.id === track.id && isLoadingTrack" 
                   class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div class="bg-orange-500 text-white rounded-full p-2">
                  <font-awesome-icon icon="spinner" class="text-sm animate-spin" />
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
               class="col-span-6 text-center py-16 text-gray-300">
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

// 收藏功能
const favoriteTrackIds = ref(new Set())
const favoriteTracks = ref([])

// 追蹤當前選中的標籤
const selectedTag = ref('')

// Jamendo API 官方推薦的10個曲風
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

// 曲風名稱中英對照
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

// 🆕 新增：自定義播放清單功能
const playlistConfig = ref([
  { genre: 'Jazz', count: 3 },
  { genre: 'Country', count: 5 },
  { genre: 'Rock', count: 1 }
])

const genreDropdownOpen = ref([false, false, false])
const countDropdownOpen = ref([false, false, false])
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
  groupBreakpoints: [], // 記錄每組的起始和結束索引
  originalConfig: [] // 保存原始配置
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

// 搜尋防抖
let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchTracks()
  }, 500)
}

// 🆕 新增：自定義播放清單控制函數
const toggleGenreDropdown = (index) => {
  // 關閉其他下拉選單
  genreDropdownOpen.value = genreDropdownOpen.value.map((_, i) => i === index ? !genreDropdownOpen.value[i] : false)
  countDropdownOpen.value = countDropdownOpen.value.map(() => false)
}

const toggleCountDropdown = (index) => {
  // 關閉其他下拉選單
  countDropdownOpen.value = countDropdownOpen.value.map((_, i) => i === index ? !countDropdownOpen.value[i] : false)
  genreDropdownOpen.value = genreDropdownOpen.value.map(() => false)
}

const selectGenre = (index, genre) => {
  playlistConfig.value[index].genre = genre.label
  genreDropdownOpen.value[index] = false
  console.log(`選擇曲風 ${index + 1}: ${genre.label}`)
}

const selectCount = (index, count) => {
  playlistConfig.value[index].count = count
  countDropdownOpen.value[index] = false
  console.log(`選擇數量 ${index + 1}: ${count}`)
}

// 🆕 新增：更新自定義播放清單狀態
const updateCustomPlaylistStatus = () => {
  if (!customPlaylistStatus.value.isActive || currentPlaylist.value.length === 0) {
    return
  }
  
  const currentIndex = currentTrackIndex.value
  const breakpoints = customPlaylistStatus.value.groupBreakpoints
  
  // 找到當前歌曲屬於哪一組
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

// 🆕 新增：改進的獲取歌曲函數（包含備案機制）
const getTracksWithFallback = async (genreValue, genreLabel, count) => {
  try {
    console.log(`🎵 嘗試按標籤獲取 ${genreLabel} 歌曲...`)
    
    // 方案1：按標籤搜尋
    if (getTracksByTag && typeof getTracksByTag === 'function') {
      const tracks = await getTracksByTag(genreValue, { limit: Math.max(count, 15) })
      
      if (tracks && tracks.length > 0) {
        console.log(`✅ 按標籤找到 ${tracks.length} 首 ${genreLabel} 歌曲`)
        return tracks
      }
    }
    
    console.log(`⚠️ 按標籤搜尋 ${genreLabel} 失敗，嘗試文字搜尋...`)
    
    // 方案2：直接搜尋曲風名稱
    if (jamendoSearch && typeof jamendoSearch === 'function') {
      const searchResults = await jamendoSearch(genreLabel, { limit: Math.max(count, 15) })
      
      if (searchResults && searchResults.length > 0) {
        console.log(`✅ 搜尋找到 ${searchResults.length} 首 ${genreLabel} 相關歌曲`)
        return searchResults
      }
    }
    
    console.log(`⚠️ 搜尋 ${genreLabel} 也失敗，嘗試獲取熱門歌曲...`)
    
    // 方案3：獲取熱門歌曲作為備案
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

// 🆕 新增：生成並播放自定義播放清單（改進版）
const startCustomPlaylist = async () => {
  try {
    isGeneratingPlaylist.value = true
    console.log('🎵 開始生成自定義播放清單...', playlistConfig.value)
    
    const customPlaylist = []
    const groupBreakpoints = []
    let currentIndex = 0
    
    // 保存原始配置
    customPlaylistStatus.value.originalConfig = [...playlistConfig.value]
    
    // 按順序為每個曲風獲取指定數量的歌曲
    for (let i = 0; i < playlistConfig.value.length; i++) {
      const config = playlistConfig.value[i]
      const genreValue = availableGenres.find(g => g.label === config.genre)?.value || 'pop'
      
      console.log(`📋 獲取 ${config.genre} 的 ${config.count} 首歌...`)
      
      try {
        // 🔧 使用改進的獲取函數（包含備案機制）
        const tracks = await getTracksWithFallback(genreValue, config.genre, config.count)
        
        if (tracks.length > 0) {
          // 🔧 過濾掉可能有問題的音軌
          const validTracks = tracks.filter(track => {
            const hasValidUrl = track.audio || track.audiodownload
            const hasBasicInfo = track.name && track.artist_name
            return hasValidUrl && hasBasicInfo
          })
          
          // 取前 N 首歌（根據用戶設定的數量）
          const selectedTracks = validTracks.slice(0, config.count)
          
          if (selectedTracks.length > 0) {
            // 記錄這一組的索引範圍
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
      // lastError.value = '無法生成播放清單，請檢查網路連接或嘗試其他曲風'
      return
    }
    
    console.log(`🎉 播放清單生成完成，共 ${customPlaylist.length} 首歌曲`)
    console.log('📊 組別分佈:', groupBreakpoints)
    
    // 🔧 設置狀態追蹤
    customPlaylistStatus.value.isActive = true
    customPlaylistStatus.value.groupBreakpoints = groupBreakpoints
    customPlaylistStatus.value.totalTracks = customPlaylist.length
    customPlaylistStatus.value.overallProgress = 1
    
    // 🔧 清除之前的錯誤
    // lastError.value = ''
    
    // 設置播放清單並開始播放第一首歌
    if (setPlaylist && typeof setPlaylist === 'function') {
      setPlaylist(customPlaylist, 0)
    }
    
    // 🔧 嘗試播放第一首歌，失敗則自動跳到下一首
    await playFirstAvailableTrack(customPlaylist)
    
    // 顯示播放清單詳情
    displayedTracks.value = customPlaylist
    currentMode.value = 'custom'
    
    // 初始化狀態顯示
    updateCustomPlaylistStatus()
    
  } catch (error) {
    console.error('❌ 生成自定義播放清單失敗:', error)
    // lastError.value = '生成播放清單失敗: ' + error.message
  } finally {
    isGeneratingPlaylist.value = false
  }
}

// 🆕 新增：播放第一首可用的歌曲
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
        // lastError.value = '播放清單中的歌曲可能有問題，請嘗試其他曲風'
        throw playError
      }
    }
  }
}

// 🆕 新增：點擊頁面其他地方關閉下拉選單
const closeAllDropdowns = () => {
  genreDropdownOpen.value = [false, false, false]
  countDropdownOpen.value = [false, false, false]
}

// 錯誤處理（已移除錯誤清除函數，但保留錯誤記錄）
// const clearError = () => {
//   lastError.value = ''
// }

// 圖片錯誤處理
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 曲風按鈕樣式控制
const getGenreButtonClass = (tag) => {
  if (selectedTag.value === tag) {
    return 'bg-pink-500 text-white font-semibold shadow-lg hover:bg-pink-600'
  } else {
    return 'bg-white text-black font-medium shadow-md border border-gray-200 hover:bg-gray-50'
  }
}

// 獲取曲風顯示名稱
const getGenreDisplayName = (tag) => {
  return genreNameMap[tag] || tag.toUpperCase()
}

// 獲取頻率組
const getFrequencyGroup = (index) => {
  if (index < 5) return 'bass'      // 低音: 0-4
  if (index < 11) return 'mid'      // 中音: 5-10
  return 'high'                     // 高音: 11-15
}

// 改進的音頻均衡器動態效果
const simulateRealisticAudioSpectrum = () => {
  if (!isPlaying.value) {
    audioFrequencyData.value = audioFrequencyData.value.map(value => 
      Math.max(0.1, value * 0.95)
    )
    updateEqualizerBars()
    return
  }
  
  const currentTimeMs = Date.now()
  const beatPeriod = 600
  const beatPhase = (currentTimeMs % beatPeriod) / beatPeriod
  const beatIntensity = Math.max(0, Math.sin(beatPhase * Math.PI * 2))
  
  audioFrequencyData.value = audioFrequencyData.value.map((currentValue, index) => {
    const freqGroup = getFrequencyGroup(index)
    let newValue = currentValue
    
    if (freqGroup === 'bass') {
      const bassPattern = beatIntensity * (0.8 + Math.sin(currentTimeMs * 0.003 + index) * 0.2)
      const bassRandom = 0.7 + Math.random() * 0.3
      newValue = bassPattern * bassRandom
      
      if (beatPhase < 0.1) {
        newValue = Math.min(1.0, newValue * 1.5)
      }
      
    } else if (freqGroup === 'mid') {
      const midBase = Math.sin(currentTimeMs * 0.005 + index * 0.8) * 0.4 + 0.5
      const midRhythm = Math.sin(beatPhase * Math.PI * 3) * 0.3
      const midRandom = 0.6 + Math.random() * 0.4
      newValue = (midBase + midRhythm) * midRandom
      
    } else {
      const highFreq = Math.sin(currentTimeMs * 0.008 + index * 1.5) * 0.5 + 0.4
      const highSpikes = Math.random() > 0.8 ? Math.random() * 0.6 : 0
      const highRandom = 0.5 + Math.random() * 0.5
      newValue = (highFreq + highSpikes) * highRandom
      
      if (beatPhase > 0.7 && beatPhase < 0.9 && Math.random() > 0.7) {
        newValue = Math.min(1.0, newValue * 2)
      }
    }
    
    const smoothing = freqGroup === 'bass' ? 0.8 : freqGroup === 'mid' ? 0.7 : 0.6
    return currentValue * smoothing + newValue * (1 - smoothing)
  })
  
  updateEqualizerBars()
}

// 更新均衡器條形顯示
const updateEqualizerBars = () => {
  equalizerBars.value.forEach((bar, index) => {
    if (!bar) return
    
    const intensity = audioFrequencyData.value[index]
    const height = Math.max(8, Math.min(90, intensity * 100))
    const freqGroup = getFrequencyGroup(index)
    
    bar.style.height = `${height}%`
    
    if (intensity > 0.8) {
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #ff4500, #ff6347, #ffa500)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #ffa500, #ffff00, #adff2f)'
      } else {
        bar.style.background = 'linear-gradient(to top, #ffff00, #ffffff, #87ceeb)'
      }
      bar.style.boxShadow = `0 0 ${intensity * 10}px rgba(255, 165, 0, ${intensity * 0.8})`
    } else if (intensity > 0.5) {
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #ff6b35, #ff8c42, #ffa449)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #f7931e, #ffab00, #ffc107)'
      } else {
        bar.style.background = 'linear-gradient(to top, #ffcc02, #ffeb3b, #fff200)'
      }
      bar.style.boxShadow = `0 0 ${intensity * 6}px rgba(255, 140, 0, ${intensity * 0.5})`
    } else {
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #8b4513, #cd853f)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #daa520, #f0e68c)'
      } else {
        bar.style.background = 'linear-gradient(to top, #f0e68c, #ffffe0)'
      }
      bar.style.boxShadow = 'none'
    }
    
    if (freqGroup === 'bass') {
      bar.style.filter = `saturate(${1 + intensity * 0.5})`
    } else if (freqGroup === 'high') {
      bar.style.filter = `brightness(${1 + intensity * 0.3}) contrast(${1 + intensity * 0.2})`
    } else {
      bar.style.filter = `hue-rotate(${intensity * 20}deg)`
    }
  })
}

// 均衡器動畫控制
let equalizerInterval = null
const startEqualizerAnimation = () => {
  if (equalizerInterval) clearInterval(equalizerInterval)
  equalizerInterval = setInterval(simulateRealisticAudioSpectrum, 80)
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

// 改進的播放控制函數 - 防止競爭條件
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

// 改進的歌曲點擊處理 - 防止重複點擊
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
    // 不再顯示錯誤訊息
    // lastError.value = '播放失敗: ' + error.message
  } finally {
    isClickProcessing = false
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
  selectedTag.value = ''
  
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
  searchQuery.value = ''
  
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
  selectedTag.value = ''
  searchQuery.value = ''
  
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

// 🆕 新增：監聽播放索引變化 - 更新自定義播放清單狀態
watch(currentTrackIndex, () => {
  if (customPlaylistStatus.value.isActive) {
    updateCustomPlaylistStatus()
  }
}, { immediate: false })

// 🆕 新增：監聽模式變化 - 重置自定義播放清單狀態
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
  
  setTimeout(() => {
    if (isPlaying.value) {
      startEqualizerAnimation()
    }
  }, 500)
  
  // 🆕 新增：添加全局點擊事件監聽器來關閉下拉選單
  document.addEventListener('click', (event) => {
    const target = event.target
    const isDropdownButton = target.closest('.genre-selector-btn') || target.closest('.count-selector-btn')
    
    if (!isDropdownButton) {
      closeAllDropdowns()
    }
  })
})

// 清理資源
onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (equalizerInterval) {
    clearInterval(equalizerInterval)
  }
  
  // 🆕 新增：移除全局事件監聽器
  document.removeEventListener('click', closeAllDropdowns)
})
</script>

<style scoped>
/* 改進的音頻均衡器視覺效果 */
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

/* 播放控制按鈕 */
.play-controls-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 1rem;
}

/* 撥放控制按鈕 */
.control-button {
  border-radius: 50%;
  width: 55px;
  height: 55px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  color: #1f2937;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #ffffff;
}

.control-button:hover:not(:disabled) {
  background-color: #f9bc66;
}

/* 曲風按鈕樣式 */
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
  background-color: #dba8c1;
}

/* 選中狀態：粉紅色背景，白色文字 */
.genre-btn-new.bg-pink-500 {
  background-color: #ec4899;
  color: white;
}

.genre-btn-new.bg-pink-500:hover {
  background-color: #db2777;
}

/* 收藏按鈕 */
.heart-outline {
  color: #a2a3a3 !important;
}

.heart-outline:hover {
  color: #ff00f7 !important;
}

.heart-filled {
  color: #ec4899 !important;
  filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.3));
}

/* 🆕 新增：浮動式下拉選單樣式 */
.floating-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: rgba(237, 244, 176, 0.542);
  border: 1px solid #1f4288;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(14, 14, 14, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 9999; /* 🔧 確保浮動在最上層 */
  min-width: 120px;
  max-height: 200px;
  overflow-y: auto;
  backdrop-filter: blur(8px);
  animation: dropdownFadeIn 0.15s ease-out;
}

/* 下拉內的文字 */
.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  color: #000000;
  font-weight: 500;
  transition: all 0.15s ease;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.dropdown-item:first-child {
  border-top-left-radius: 7px;
  border-top-right-radius: 7px;
}

.dropdown-item:last-child {
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
  border-bottom: none;
}

/* 下拉選單動畫 */
@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 混和曲風播放清單 */
.custom-playlist-status {
  min-width: 160px;
  max-width: 200px;
  border: 1px solid rgba(255, 252, 252, 0.3);
  backdrop-filter: blur(5px);
}

.custom-playlist-status:hover {
  background: rgba(50, 65, 106, 0.6);
  border-color: rgba(255, 255, 254, 0.5);
}

/* 改進音頻均衡器樣式 */
.audio-visualizer {
  transition: opacity 0.3s ease;
}

/* 🔧 確保相對定位容器正確設置 */
.relative {
  position: relative;
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
  
  .custom-playlist-status {
    min-width: 150px;
    max-width: 200px;
  }
  
  .custom-playlist-status .text-sm {
    font-size: 0.75rem;
  }
  
  .custom-playlist-status .text-xs {
    font-size: 0.7rem;
  }
  
  .floating-dropdown {
    min-width: 100px;
    max-height: 150px;
  }
  
  .dropdown-item {
    padding: 6px 12px;
    font-size: 0.875rem;
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
  
  /* 混和曲風播放清單在小屏幕上的響應式調整 */
  .flex-wrap {
    flex-wrap: wrap;
  }
  
  .space-x-4 > * + * {
    margin-left: 0.5rem;
  }
  
  .gap-4 {
    gap: 0.5rem;
  }
}
</style>