<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 左側邊欄 -->
    <div class="w-64 sidebar text-white p-4">
      <!-- Logo 和登入區域 -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-yellow-400">DDM360</h1>
        <div class="flex space-x-2">
          <button class="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
            登入
          </button>
          <button class="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
            註冊
          </button>
        </div>
      </div>

      <!-- 主要導航選單 -->
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
          新歌
        </button>
        <button class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors">
          <font-awesome-icon icon="star" class="mr-3" />
          我的收藏
        </button>
      </nav>

      <!-- 分隔線 -->
      <hr class="border-gray-600 mb-4">

      <!-- 次要選單 -->
      <nav class="space-y-2 mb-8">
        <button class="flex items-center w-full p-2 rounded hover:bg-gray-700 transition-colors">
          <font-awesome-icon icon="video" class="mr-3" />
          演唱會 / MV
        </button>
        <button class="flex items-center w-full p-2 rounded hover:bg-gray-700 transition-colors">
          <font-awesome-icon icon="heart" class="mr-3" />
          我的收藏
        </button>
      </nav>

      <!-- 社交媒體連結 -->
      <div class="space-y-3">
        <a href="#" class="flex items-center text-gray-300 hover:text-white transition-colors">
          <font-awesome-icon :icon="['fab', 'facebook']" class="text-xl mr-3" />
          Facebook
        </a>
        <a href="#" class="flex items-center text-gray-300 hover:text-white transition-colors">
          <font-awesome-icon :icon="['fab', 'twitter']" class="text-xl mr-3" />
          Twitter
        </a>
        <a href="#" class="flex items-center text-gray-300 hover:text-white transition-colors">
          <font-awesome-icon icon="link" class="text-xl mr-3" />
          其他連結
        </a>
      </div>
    </div>

    <!-- 主要內容區域 -->
    <div class="flex-1 main-content">
      <!-- 頂部控制區 -->
      <div class="bg-gray-800 p-6 text-white">
        <div class="flex items-center justify-center space-x-4">
          <!-- 三個粉紅色下拉選單 -->
          <div class="dropdown dropdown-bottom">
            <label tabindex="0" class="btn bg-pink-500 hover:bg-pink-600 text-white border-none px-6 py-2 rounded-full">
              {{ selectedGenres.first }} <font-awesome-icon icon="chevron-down" class="ml-2" />
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-52 text-black">
              <li v-for="genre in genres" :key="genre" @click="selectGenre('first', genre)">
                <a>{{ genre }}</a>
              </li>
            </ul>
          </div>

          <span class="text-yellow-400 text-2xl font-bold">+</span>

          <div class="dropdown dropdown-bottom">
            <label tabindex="0" class="btn bg-pink-500 hover:bg-pink-600 text-white border-none px-6 py-2 rounded-full">
              {{ selectedGenres.second }} <font-awesome-icon icon="chevron-down" class="ml-2" />
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-52 text-black">
              <li v-for="genre in genres" :key="genre" @click="selectGenre('second', genre)">
                <a>{{ genre }}</a>
              </li>
            </ul>
          </div>

          <span class="text-yellow-400 text-2xl font-bold">+</span>

          <div class="dropdown dropdown-bottom">
            <label tabindex="0" class="btn bg-pink-500 hover:bg-pink-600 text-white border-none px-6 py-2 rounded-full">
              {{ selectedGenres.third }} <font-awesome-icon icon="chevron-down" class="ml-2" />
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-52 text-black">
              <li v-for="genre in genres" :key="genre" @click="selectGenre('third', genre)">
                <a>{{ genre }}</a>
              </li>
            </ul>
          </div>

          <!-- 黃色數量選擇器 -->
          <div class="dropdown dropdown-bottom">
            <label tabindex="0" class="btn bg-yellow-400 hover:bg-yellow-500 text-black border-none px-4 py-2 rounded-full font-bold">
              {{ songsPerGenre }} <font-awesome-icon icon="chevron-down" class="ml-2" />
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-20 text-black">
              <li v-for="num in [1,2,3,4,5]" :key="num" @click="setSongsPerGenre(num)">
                <a>{{ num }}</a>
              </li>
            </ul>
          </div>
        </div>

        <!-- HTML5 音樂播放器 -->
        <div class="flex items-center justify-center mt-6 space-x-4">
          <button @click="togglePlay" class="btn btn-circle bg-white text-gray-800 hover:bg-gray-200 border-none">
            <font-awesome-icon :icon="isPlaying ? 'pause' : 'play'" class="text-xl" />
          </button>
          
          <div class="flex items-center space-x-3 min-w-96">
            <span class="text-sm">{{ formatTime(currentTime) }}</span>
            <div class="flex-1 bg-gray-600 rounded-full h-2 cursor-pointer relative" @click="seek">
              <div class="progress-bar h-2 rounded-full" :style="{ width: progressPercentage + '%' }"></div>
            </div>
            <span class="text-sm">{{ formatTime(duration) }}</span>
          </div>
          
          <button @click="toggleMute" class="btn btn-circle bg-transparent text-white hover:bg-gray-700 border-none">
            <font-awesome-icon :icon="isMuted ? 'volume-mute' : 'volume-up'" class="text-xl" />
          </button>
          
          <audio ref="audioPlayer" @timeupdate="updateTime" @loadedmetadata="updateDuration" @ended="onSongEnd">
            <source :src="currentSong.audio_file" type="audio/mpeg">
            您的瀏覽器不支援音頻播放。
          </audio>
        </div>

        <!-- 當前播放歌曲信息 -->
        <div class="flex items-center justify-center mt-4" v-if="currentSong.title">
          <img :src="getImageUrl(currentSong.album?.cover_image)" :alt="currentSong.title" class="w-12 h-12 rounded-lg object-cover mr-3">
          <div class="text-left">
            <p class="font-medium text-sm">{{ currentSong.title }}</p>
            <p class="text-xs text-gray-300">{{ currentSong.artist?.name || currentSong.artist }}</p>
          </div>
        </div>
      </div>

      <!-- 曲風按鈕區域 -->
      <div class="p-6">
        <div class="grid grid-cols-5 gap-4 mb-8">
          <button v-for="genre in genres.slice(0, 5)" :key="genre" 
                  @click="setCurrentMode(genre)"
                  class="genre-button btn bg-gray-400 hover:bg-gray-500 text-white border-none py-3 px-6 rounded-lg transition-all duration-300"
                  :class="{ 'bg-pink-500 hover:bg-pink-600': currentMode === genre }">
            {{ genre }}
          </button>
        </div>
        <div class="grid grid-cols-5 gap-4 mb-8">
          <button v-for="genre in genres.slice(5, 10)" :key="genre" 
                  @click="setCurrentMode(genre)"
                  class="genre-button btn bg-gray-400 hover:bg-gray-500 text-white border-none py-3 px-6 rounded-lg transition-all duration-300"
                  :class="{ 'bg-pink-500 hover:bg-pink-600': currentMode === genre }">
            {{ genre }}
          </button>
        </div>

        <!-- 載入狀態顯示 -->
        <div v-if="loading" class="flex justify-center items-center h-32 mb-6">
          <div class="flex items-center space-x-3 text-gray-600">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            <span class="text-lg">載入中...</span>
          </div>
        </div>
        
        <!-- 錯誤狀態顯示 -->
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div class="flex items-center">
            <font-awesome-icon icon="exclamation-triangle" class="mr-2" />
            {{ error }}
            <button @click="retryLoad" class="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
              重試
            </button>
          </div>
        </div>

        <!-- 隨機播放標題 -->
       <div class="flex items-center mb-6">
  <span class="bg-pink-500 text-white px-4 py-2 rounded-full font-bold">
    <font-awesome-icon icon="random" class="mr-2" />
    隨機播放
  </span>
  <span class="ml-4 text-gray-700 font-medium">{{ currentModeText }}</span>
  <button class="ml-auto text-teal-500 hover:text-teal-600 font-medium mr-2" @click="debugDisplayedSongs">
    調試數據
  </button>
  <button class="text-blue-500 hover:text-blue-600 font-medium" @click="testAudioDirectly">
    測試音頻
  </button>
</div>

        <!-- 🔧 改進的音樂卡片區域 -->
        <div class="grid grid-cols-6 gap-4">
          <div v-for="song in displayedSongs" :key="song.id" 
               @click="playSong(song)"
               class="music-card bg-white rounded-lg p-4 shadow-md hover:shadow-lg cursor-pointer transition-all duration-300 border">
            
            <!-- 🔧 調試信息 -->
            <div class="text-xs text-gray-400 mb-2">ID: {{ song.id }}</div>
            
            <!-- 🔧 改進的圖片顯示 -->
            <div class="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
              <img v-if="song.album?.cover_image" 
                   :src="getImageUrl(song.album.cover_image)" 
                   :alt="song.title" 
                   class="w-full h-full object-cover"
                   @error="handleImageError"
                   @load="handleImageLoad">
              <img v-else-if="song.image" 
                   :src="getImageUrl(song.image)" 
                   :alt="song.title" 
                   class="w-full h-full object-cover"
                   @error="handleImageError">
              <div v-else class="text-gray-400 text-center">
                <font-awesome-icon icon="music" class="text-2xl mb-2" />
                <div class="text-xs">無封面</div>
              </div>
            </div>
            
            <!-- 歌曲標題 -->
            <h3 class="font-bold text-sm text-gray-800 truncate mb-1">{{ song.title || '未知歌曲' }}</h3>
            
            <!-- 藝人顯示 -->
            <p class="text-xs text-gray-600 truncate mb-1">
              {{ song.artist?.name || song.artist || '未知藝人' }}
            </p>
            
            <!-- 專輯顯示 -->
            <p class="text-xs text-gray-500 truncate mb-1" v-if="song.album?.title">
              {{ song.album.title }}
            </p>
            
            <!-- 曲風和時長 -->
            <div class="flex justify-between items-center text-xs text-gray-500">
              <span>{{ song.genre || 'Unknown' }}</span>
              <span v-if="song.duration">{{ formatTime(song.duration) }}</span>
            </div>
            
            <!-- 音頻文件狀態 -->
            <div class="text-xs mt-1" :class="song.audio_file ? 'text-green-500' : 'text-red-500'">
              {{ song.audio_file ? '有音頻' : '無音頻' }}
            </div>
          </div>
          
          <!-- 無歌曲時的提示 -->
          <div v-if="!loading && displayedSongs.length === 0" 
               class="col-span-6 text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <font-awesome-icon icon="exclamation-triangle" class="text-4xl mb-4 text-gray-300" />
            <p class="text-lg">沒有找到歌曲</p>
            <p class="text-sm">當前模式：{{ currentModeText }}</p>
            <button @click="retryLoad" class="mt-4 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">
              重新載入
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { musicAPI, testConnection } from './services/api'

// 響應式數據
const genres = ref(['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 'Latin', 'R&B', 'Folk'])
const selectedGenres = ref({
  first: 'Jazz',
  second: 'Country',
  third: 'Rock'
})
const songsPerGenre = ref(3)
const currentMode = ref('random')
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const loading = ref(false)
const error = ref(null)

// 📡 使用真實 API 數據
const currentSong = ref({})
const songs = ref([])
const displayedSongsData = ref([])

// 音頻播放器引用
const audioPlayer = ref(null)

// 🔧 添加圖片 URL 處理函數
const getImageUrl = (imagePath) => {
  console.log('🖼️ 處理圖片路徑:', imagePath)
  
  if (!imagePath || imagePath === 'undefined' || imagePath === null || imagePath === 'null') {
    console.log('🖼️ 無圖片，使用 placeholder')
    return 'https://via.placeholder.com/300x300/666/fff?text=No+Image'
  }
  
  // 如果已經是完整的 HTTPS URL，直接返回
  if (imagePath.startsWith('https://') || imagePath.startsWith('http://')) {
    console.log('🖼️ 使用完整 URL:', imagePath)
    return imagePath
  }
  
  // 如果是相對路徑，拼接後端域名
  const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : `http://${window.location.hostname}:8000`
    
  const fullUrl = `${baseURL}/media/${imagePath}`
  console.log('🖼️ 拼接相對路徑:', fullUrl)
  return fullUrl
}

// 🔧 修正的圖片錯誤處理
const handleImageError = (event) => {
  console.warn('🖼️ 圖片載入失敗:', event.target.src)
  // 使用更穩定的 placeholder
  event.target.src = 'https://via.placeholder.com/300x300/ff6b6b/fff?text=Error'
}

const handleImageLoad = (event) => {
  console.log('🖼️ 圖片載入成功:', event.target.src)
}

// 🔧 添加調試函數
const debugDisplayedSongs = () => {
  console.log('🔍 當前顯示的歌曲:', displayedSongs.value)
  displayedSongs.value.forEach((song, index) => {
    console.log(`🔍 歌曲 ${index + 1}:`, {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      cover_image: song.album?.cover_image,
      audio_file: song.audio_file,
      genre: song.genre
    })
  })
}

const debugSongData = (song) => {
  console.log('🔍 完整歌曲數據:', song)
  console.log('🔍 歌曲字段:')
  console.log('  - id:', song.id)
  console.log('  - title:', song.title)
  console.log('  - audio_file:', song.audio_file)
  console.log('  - audioFile:', song.audioFile)
  console.log('  - album:', song.album)
  console.log('  - album.cover_image:', song.album?.cover_image)
  console.log('  - 所有字段:', Object.keys(song))
  
  // 檢查音頻文件
  if (song.audio_file) {
    console.log('🎵 音頻文件存在:', song.audio_file)
  } else {
    console.warn('🎵 音頻文件不存在')
  }
  
  // 檢查封面圖片
  if (song.album?.cover_image) {
    console.log('🖼️ 封面圖片存在:', song.album.cover_image)
  } else {
    console.warn('🖼️ 封面圖片不存在')
  }
}

// 🧪 添加測試函數
const testAudioDirectly = () => {
  console.log('🧪 直接測試音頻播放...')
  const testUrls = [
    "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    "https://www.w3schools.com/html/horse.mp3",
    "https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/viper.mp3"
  ]
  
  let currentIndex = 0
  
  const tryNextAudio = () => {
    if (currentIndex >= testUrls.length) {
      console.error('🧪 所有測試音頻都失敗了')
      return
    }
    
    const testUrl = testUrls[currentIndex]
    console.log(`🧪 測試音頻 ${currentIndex + 1}:`, testUrl)
    
    if (audioPlayer.value) {
      audioPlayer.value.src = testUrl
      audioPlayer.value.load()
      
      audioPlayer.value.oncanplay = () => {
        console.log('🧪 測試音頻可以播放:', testUrl)
        audioPlayer.value.play().then(() => {
          isPlaying.value = true
          console.log('🧪 測試播放成功!')
        }).catch(error => {
          console.error('🧪 測試播放失敗:', error)
          currentIndex++
          tryNextAudio()
        })
      }
      
      audioPlayer.value.onerror = (e) => {
        console.error('🧪 測試音頻載入失敗:', e)
        currentIndex++
        tryNextAudio()
      }
    }
  }
  
  tryNextAudio()
}

// 🔧 添加重試函數
const retryLoad = () => {
  error.value = null
  if (currentMode.value === 'random') {
    loadRandomSongs()
  } else if (currentMode.value === 'latest') {
    loadLatestSongs()
  } else if (genres.value.includes(currentMode.value)) {
    loadSongsByGenre(currentMode.value)
  } else {
    loadAllSongs().then(() => loadRandomSongs())
  }
}

// 🔄 API 方法
const loadAllSongs = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await musicAPI.getAllSongs()
    songs.value = response.data.results || response.data
    console.log('載入歌曲成功:', songs.value.length, '首')
  } catch (err) {
    error.value = '載入歌曲失敗: ' + err.message
    console.error('載入歌曲失敗:', err)
    // 如果 API 失敗，使用備用假數據
    songs.value = getFallbackSongs()
  } finally {
    loading.value = false
  }
}

const loadSongsByGenre = async (genre) => {
  loading.value = true
  error.value = null
  try {
    const response = await musicAPI.getSongsByGenre(genre)
    displayedSongsData.value = response.data.results || response.data
    console.log(`載入 ${genre} 歌曲成功:`, displayedSongsData.value.length, '首')
  } catch (err) {
    error.value = `載入 ${genre} 歌曲失敗: ` + err.message
    console.error('載入曲風歌曲失敗:', err)
    // 如果 API 失敗，從本地數據篩選
    displayedSongsData.value = songs.value.filter(song => song.genre === genre)
  } finally {
    loading.value = false
  }
}

const loadRandomSongs = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await musicAPI.getRandomSongs(6)
    displayedSongsData.value = response.data.results || response.data
    console.log('載入隨機歌曲成功:', displayedSongsData.value.length, '首')
  } catch (err) {
    error.value = '載入隨機歌曲失敗: ' + err.message
    console.error('載入隨機歌曲失敗:', err)
    // 如果 API 失敗，使用本地隨機
    displayedSongsData.value = shuffleArray([...songs.value]).slice(0, 6)
  } finally {
    loading.value = false
  }
}

const loadLatestSongs = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await musicAPI.getLatestSongs(6)
    displayedSongsData.value = response.data.results || response.data
    console.log('載入最新歌曲成功:', displayedSongsData.value.length, '首')
  } catch (err) {
    error.value = '載入最新歌曲失敗: ' + err.message
    console.error('載入最新歌曲失敗:', err)
    // 如果 API 失敗，使用本地數據
    displayedSongsData.value = songs.value.slice(0, 6)
  } finally {
    loading.value = false
  }
}

// 備用假數據（API 失敗時使用）
const getFallbackSongs = () => [
  {
    id: 1,
    title: 'bomb',
    artist: { name: 'ILLIT' },
    album: { title: 'Super Real Me', cover_image: 'https://via.placeholder.com/200x200/333/fff?text=bomb' },
    genre: 'Pop',
    audio_file: '',
    duration: 210
  },
  {
    id: 2,
    title: 'Lemon Drop (Remix)',
    artist: { name: 'ATEEZ' },
    album: { title: 'Golden Hour', cover_image: 'https://via.placeholder.com/200x200/FFA500/fff?text=Lemon' },
    genre: 'Hip-Hop',
    audio_file: '',
    duration: 195
  },
  {
    id: 3,
    title: 'GOLDEN HOUR : Part.3',
    artist: { name: 'ATEEZ' },
    album: { title: 'Golden Hour Part.3', cover_image: 'https://via.placeholder.com/200x200/FFD700/000?text=Golden' },
    genre: 'Pop',
    audio_file: '',
    duration: 240
  },
  {
    id: 4,
    title: 'Girls Will Be Girls (Remix)',
    artist: { name: 'ITZY' },
    album: { title: 'Gold', cover_image: 'https://via.placeholder.com/200x200/333/fff?text=Girls' },
    genre: 'Pop',
    audio_file: '',
    duration: 205
  },
  {
    id: 5,
    title: 'Girls Will Be Girls',
    artist: { name: 'ITZY' },
    album: { title: 'Gold', cover_image: 'https://via.placeholder.com/200x200/333/fff?text=Girls' },
    genre: 'Pop',
    audio_file: '',
    duration: 200
  },
  {
    id: 6,
    title: 'DESIRE : UNLEASH',
    artist: { name: 'ENHYPEN' },
    album: { title: 'Romance Untold', cover_image: 'https://via.placeholder.com/200x200/000/fff?text=DESIRE' },
    genre: 'Rock',
    audio_file: '',
    duration: 220
  }
]

// 計算屬性
const progressPercentage = computed(() => {
  return duration.value ? (currentTime.value / duration.value) * 100 : 0
})

const currentModeText = computed(() => {
  const modeTexts = {
    'random': '隨機播放',
    'latest': '新歌',
    'Pop': 'Pop',
    'Rock': 'Rock',
    'Hip-Hop': 'Hip-Hop',
    'Electronic': 'Electronic',
    'Jazz': 'Jazz',
    'Classical': 'Classical',
    'Country': 'Country',
    'Latin': 'Latin',
    'R&B': 'R&B',
    'Folk': 'Folk'
  }
  return modeTexts[currentMode.value] || ''
})

const displayedSongs = computed(() => {
  // 如果有 API 數據，使用 API 數據
  if (displayedSongsData.value.length > 0) {
    return displayedSongsData.value
  }
  
  // 否則使用本地邏輯
  if (currentMode.value === 'random') {
    return shuffleArray([...songs.value]).slice(0, 6)
  } else if (currentMode.value === 'latest') {
    return songs.value.slice(0, 6)
  } else if (genres.value.includes(currentMode.value)) {
    return songs.value.filter(song => song.genre === currentMode.value).slice(0, 6)
  }
  return songs.value.slice(0, 6)
})

// 方法
const selectGenre = (position, genre) => {
  selectedGenres.value[position] = genre
}

const setSongsPerGenre = (num) => {
  songsPerGenre.value = num
}

const setCurrentMode = async (mode) => {
  currentMode.value = mode
  
  // 根據模式載入不同數據
  if (mode === 'random') {
    await loadRandomSongs()
  } else if (mode === 'latest') {
    await loadLatestSongs()
  } else if (genres.value.includes(mode)) {
    await loadSongsByGenre(mode)
  }
}

const togglePlay = () => {
  if (audioPlayer.value && currentSong.value.audio_file) {
    if (isPlaying.value) {
      audioPlayer.value.pause()
    } else {
      audioPlayer.value.play()
    }
    isPlaying.value = !isPlaying.value
  }
}

const toggleMute = () => {
  if (audioPlayer.value) {
    audioPlayer.value.muted = !audioPlayer.value.muted
    isMuted.value = audioPlayer.value.muted
  }
}

// 🔧 改進 playSong 函數
const playSong = (song) => {
  console.log('🎵 選擇播放歌曲:', song.title)
  
  // 🔍 添加詳細調試
  debugSongData(song)
  
  // 停止當前播放
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.currentTime = 0
  }
  
  currentSong.value = song
  
  // 🔧 檢查多個可能的字段名稱
  let audioUrl = song.audio_file || song.audioFile || song.audiourl || null
  
  console.log('🎵 檢測到的音頻 URL:', audioUrl)
  
  if (audioUrl && audioUrl !== 'undefined' && audioUrl !== 'null') {
    console.log('🎵 準備播放:', audioUrl)
    
    if (audioPlayer.value) {
      audioPlayer.value.src = audioUrl
      
      // 添加事件監聽器
      audioPlayer.value.oncanplay = () => {
        console.log('🎵 音頻可以播放')
        audioPlayer.value.play().then(() => {
          isPlaying.value = true
          console.log('🎵 播放成功:', song.title)
        }).catch(error => {
          console.error('🎵 播放失敗:', error)
          console.error('🎵 失敗的 URL:', audioUrl)
        })
      }
      
      audioPlayer.value.onerror = (e) => {
        console.error('🎵 音頻載入錯誤:', e)
        console.error('🎵 錯誤的 URL:', audioUrl)
      }
      
      audioPlayer.value.load()
    }
  } else {
    console.warn('🎵 找不到音頻文件字段:', song)
    console.warn('🎵 可用字段:', Object.keys(song))
  }
}

const updateTime = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
  }
}

const updateDuration = () => {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration
  }
}

const onSongEnd = () => {
  isPlaying.value = false
  // 可以在這裡添加自動播放下一首的邏輯
}

const seek = (event) => {
  if (audioPlayer.value && event.currentTarget) {
    const progressBar = event.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const width = rect.width
    const percentage = clickX / width
    audioPlayer.value.currentTime = percentage * duration.value
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 🚀 生命週期：頁面載入時執行
onMounted(async () => {
  console.log('🚀 App 組件已掛載，開始連接測試...')
  
  // 測試後端連接
  const isConnected = await testConnection()
  if (!isConnected) {
    error.value = '無法連接到後端服務器，請確認服務器是否正在運行'
    return
  }
  
  // 如果連接成功，繼續載入數據
  loadAllSongs().then(() => {
    loadRandomSongs().then(() => {
      // 載入完成後進行調試
      setTimeout(debugDisplayedSongs, 1000)
    })
  })
})

// 在某個按鈕點擊事件中測試
const testAudio = () => {
  const testUrl = "https://www.soundjay.com/misc/sounds/coin-drop-4.mp3"
  console.log('🎵 測試播放:', testUrl)
  
  if (audioPlayer.value) {
    audioPlayer.value.src = testUrl
    audioPlayer.value.load()
    audioPlayer.value.play().then(() => {
      console.log('🎵 測試播放成功！')
      isPlaying.value = true
    }).catch(error => {
      console.error('🎵 測試播放失敗:', error)
    })
  }
}

</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
}

.main-content {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.progress-bar {
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
}

.music-card:hover {
  transform: scale(1.05);
}

.genre-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>