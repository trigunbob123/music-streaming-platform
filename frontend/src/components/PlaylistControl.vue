<template>
  <div class="p-4 bg-[url('@/assets/images/61.png')] bg-cover bg-center rounded-lg">
    <!-- 標題區域 -->
    <div class="mb-0">
      <span class="text-white text-sm font-medium">🎶自選混和曲風與數量</span>
    </div>
    
    <!-- 控制區域 - 確保所有元素高度一致 -->

    <div class="flex items-end space-x-4 flex-wrap">
      <!-- 第一個曲風按鈕組 -->
      <div class="flex items-center space-x-2">
        <!-- 曲風下拉按鈕 -->
        <div class="relative">
          <button 
            @click="toggleGenreDropdown(0)" 
            class="genre-selector-btn px-6 py-3 bg-blue-100 text-blue rounded-lg font-semibold hover:bg-blue-300 flex items-center space-x-2 cursor-pointer"
          >
            <span>{{ playlistConfig[0].genre }}</span>
            <font-awesome-icon icon="chevron-down" class="text-sm" />
          </button>
          <!-- 浮動式曲風下拉選單 -->
          <div v-if="genreDropdownOpen[0]" class="floating-dropdown">
            <div 
              v-for="genre in availableGenres" 
              :key="genre.value" 
              @click="selectGenre(0, genre)" 
              class="dropdown-item"
            >
              {{ genre.label }}
            </div>
          </div>
        </div>

        <!-- 數量下拉按鈕 -->
        <div class="relative">
          <button 
            @click="toggleCountDropdown(0)" 
            class="count-selector-btn px-4 py-3 bg-blue-300 text-black rounded-lg font-bold hover:bg-blue-100 flex items-center space-x-2 cursor-pointer"
          >
            <span>{{ playlistConfig[0].count }}首</span>
            <font-awesome-icon icon="chevron-down" class="text-sm" />
          </button>
          <!-- 浮動式數字下拉選單 -->
          <div v-if="countDropdownOpen[0]" class="floating-dropdown">
            <div 
              v-for="count in [1, 2, 3, 4, 5]" 
              :key="count" 
              @click="selectCount(0, count)" 
              class="dropdown-item"
            >
              {{ count }}首歌曲
            </div>
          </div>
        </div>
      </div>

      <!-- 加號 -->
      <div class="text-white text-2xl font-bold relative -translate-y-3">+</div>

      <!-- 第二個曲風按鈕組 -->
      <div class="flex items-center space-x-2">
        <div class="relative">
          <button 
            @click="toggleGenreDropdown(1)" 
            class="genre-selector-btn px-6 py-3 bg-blue-100 text-black rounded-lg font-semibold hover:bg-blue-300 flex items-center space-x-2 cursor-pointer"
          >
            <span>{{ playlistConfig[1].genre }}</span>
            <font-awesome-icon icon="chevron-down" class="text-sm" />
          </button>
          <div v-if="genreDropdownOpen[1]" class="floating-dropdown">
            <div 
              v-for="genre in availableGenres" 
              :key="genre.value" 
              @click="selectGenre(1, genre)" 
              class="dropdown-item"
            >
              {{ genre.label }}
            </div>
          </div>
        </div>
        <div class="relative">
          <button 
            @click="toggleCountDropdown(1)" 
            class="count-selector-btn px-4 py-3 bg-blue-300 text-black rounded-lg font-bold hover:bg-blue-100 flex items-center space-x-2 cursor-pointer"
          >
            <span>{{ playlistConfig[1].count }}首</span>
            <font-awesome-icon icon="chevron-down" class="text-sm" />
          </button>
          <div v-if="countDropdownOpen[1]" class="floating-dropdown">
            <div 
              v-for="count in [1, 2, 3, 4, 5]" 
              :key="count" 
              @click="selectCount(1, count)" 
              class="dropdown-item"
            >
              {{ count }}首歌曲
            </div>
          </div>
        </div>
      </div>

      <!-- 加號 -->
      <div class="text-white text-2xl font-bold relative -translate-y-3">+</div>

      <!-- 第三個曲風按鈕組 -->
      <div class="flex items-center space-x-2">
        <div class="relative">
          <button 
            @click="toggleGenreDropdown(2)" 
            class="genre-selector-btn px-6 py-3 bg-blue-100 text-black rounded-lg font-semibold hover:bg-blue-300 flex items-center space-x-2 cursor-pointer"
          >
            <span>{{ playlistConfig[2].genre }}</span>
            <font-awesome-icon icon="chevron-down" class="text-sm" />
          </button>
          <div v-if="genreDropdownOpen[2]" class="floating-dropdown">
            <div 
              v-for="genre in availableGenres" 
              :key="genre.value" 
              @click="selectGenre(2, genre)" 
              class="dropdown-item"
            >
              {{ genre.label }}
            </div>
          </div>
        </div>
        <div class="relative">
          <button 
            @click="toggleCountDropdown(2)" 
            class="count-selector-btn px-4 py-3 bg-blue-300 text-black rounded-lg font-bold hover:bg-blue-100 flex items-center space-x-2 cursor-pointer"
          >
            <span>{{ playlistConfig[2].count }}首</span>
            <font-awesome-icon icon="chevron-down" class="text-sm" />
          </button>
          <div v-if="countDropdownOpen[2]" class="floating-dropdown">
            <div 
              v-for="count in [1, 2, 3, 4, 5]" 
              :key="count" 
              @click="selectCount(2, count)" 
              class="dropdown-item"
            >
              {{ count }}首歌曲
            </div>
          </div>
        </div>
      </div>

      <!-- 播放按鈕 -->
      <button 
        @click="$emit('start-custom-playlist')" 
        :disabled="isGeneratingPlaylist"
        class="play-playlist-btn px-6 py-3 bg-orange-400 text-black hover:bg-gray-700 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
      >
        <font-awesome-icon v-if="isGeneratingPlaylist" icon="spinner" class="animate-spin" />
        <font-awesome-icon v-else icon="play" />
        <span v-if="isGeneratingPlaylist">生成中...</span>
        <span v-else>播放</span>
      </button>

      <!-- 🔧 修改：固定高度的狀態顯示區域 -->
      <div class="status-container">
        <div 
          v-if="customPlaylistStatus.isActive && currentMode === 'custom'" 
          class="custom-playlist-status bg-blue-900/50 px-4 py-2 rounded-lg"
        >
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  playlistConfig: {
    type: Array,
    required: true
  },
  isGeneratingPlaylist: {
    type: Boolean,
    required: true
  },
  customPlaylistStatus: {
    type: Object,
    required: true
  },
  currentMode: {
    type: String,
    required: true
  }
})

defineEmits(['start-custom-playlist'])

const genreDropdownOpen = ref([false, false, false])
const countDropdownOpen = ref([false, false, false])

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
  props.playlistConfig[index].genre = genre.label
  genreDropdownOpen.value[index] = false
  console.log(`選擇曲風 ${index + 1}: ${genre.label}`)
}

const selectCount = (index, count) => {
  props.playlistConfig[index].count = count
  countDropdownOpen.value[index] = false
  console.log(`選擇數量 ${index + 1}: ${count}`)
}

// 點擊頁面其他地方關閉下拉選單
const closeAllDropdowns = () => {
  genreDropdownOpen.value = [false, false, false]
  countDropdownOpen.value = [false, false, false]
}

const handleDocumentClick = (event) => {
  const target = event.target
  const isDropdownButton = target.closest('.genre-selector-btn') || target.closest('.count-selector-btn')
  
  if (!isDropdownButton) {
    closeAllDropdowns()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
/* 🔧 新增：固定高度的狀態容器 */
.status-container {
  min-width: 160px;
  min-height: 68px; /* 固定最小高度，確保空間預留 */
  display: flex;
  align-items: center;
}

/* 浮動式下拉選單樣式 */
.floating-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: rgba(237, 244, 176, 0.542);
  border: 1px solid #1f4288;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(14, 14, 14, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 9999;
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

/* 確保相對定位容器正確設置 */
.relative {
  position: relative;
}

/* 響應式設計 */
@media (max-width: 1024px) {
  .status-container {
    min-height: 60px;
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
  .status-container {
    min-height: 55px;
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