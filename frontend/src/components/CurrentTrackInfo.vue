<template>
  <div class="flex items-center min-w-0 flex-1" v-if="currentTrack.name">
    <!-- 封面 -->
    <div class="w-20 h-20 rounded-lg mr-4 overflow-hidden flex-shrink-0">
      <img 
        v-if="currentTrack.image" 
        :src="currentTrack.image" 
        :alt="currentTrack.name" 
        class="w-full h-full object-cover"
        @error="handleImageError" 
      />
      <div 
        v-else 
        class="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"
      >
        <font-awesome-icon icon="music" class="text-white text-2xl" />
      </div>
    </div>
    
    <!-- 歌曲信息 -->
    <div class="min-w-0 flex-1 track-info-container">
      <p 
        class="font-medium text-lg leading-tight max-h-12 overflow-hidden track-title" 
        :title="currentTrack.name"
      >
        {{ currentTrack.name }}
      </p>
      <p 
        class="text-sm text-gray-300 truncate mt-1" 
        :title="currentTrack.artist_name"
      >
        {{ currentTrack.artist_name }}
      </p>
      <p 
        v-if="currentTrack.album_name" 
        class="text-xs text-orange-400 album-name"
        :class="{ 'album-long': isAlbumNameLong }"
        :title="currentTrack.album_name"
      >
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
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentTrack: {
    type: Object,
    required: true
  }
})

// 計算專輯名稱是否過長
const isAlbumNameLong = computed(() => {
  return props.currentTrack.album_name && props.currentTrack.album_name.length > 25
})

const handleImageError = (event) => {
  event.target.style.display = 'none'
}
</script>

<style scoped>
.track-info-container {
  max-width: 300px; /* 限制整個信息區域的最大寬度 */
}

.track-title {
  line-height: 1.2; 
  display: -webkit-box; 
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical;
}

.album-name {
  line-height: 1.3;
  overflow: hidden;
  word-break: break-word;
  hyphens: auto;
}

/* 當專輯名稱過長時，允許顯示兩行 */
.album-name.album-long {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 2.6em; /* 大約兩行的高度 */
}

/* 當專輯名稱較短時，保持單行顯示 */
.album-name:not(.album-long) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 響應式設計 */
@media (max-width: 1024px) {
  .track-info-container {
    max-width: 250px;
  }
  
  .album-name.album-long {
    font-size: 0.7rem;
    max-height: 2.4em;
  }
}

@media (max-width: 768px) {
  .track-info-container {
    max-width: 200px;
  }
  
  .track-title {
    font-size: 1rem;
    max-height: 2.4em;
  }
  
  .album-name.album-long {
    font-size: 0.65rem;
    max-height: 2.2em;
  }
}

@media (max-width: 480px) {
  .track-info-container {
    max-width: 150px;
  }
  
  .track-title {
    font-size: 0.9rem;
    max-height: 2.2em;
  }
  
  .album-name.album-long {
    font-size: 0.6rem;
    max-height: 2em;
  }
}
</style>