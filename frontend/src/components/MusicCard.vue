<template>
  <div 
    class="music-card bg-white rounded-lg p-3 shadow-md hover:shadow-lg cursor-pointer border relative"
    :class="{ 'ring-2 ring-orange-500': currentTrack.id === track.id }"
  >
    <!-- 愛心收藏按鈕 -->
    <button 
      @click.stop="$emit('toggle-favorite')" 
      class="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-300 hover:scale-110 shadow-sm"
    >
      <font-awesome-icon 
        :icon="isFavorite ? ['fas', 'heart'] : ['far', 'heart']"
        class="text-sm transition-all duration-300"
        :class="isFavorite ? 'text-pink-500 heart-filled' : 'text-gray-400 hover:text-gray-600 heart-outline'" 
      />
    </button>
    
    <!-- 封面 -->
    <div 
      class="w-full h-24 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative"
      @click="$emit('track-click')"
    >
      <img 
        v-if="track.image" 
        :src="track.image" 
        :alt="track.name" 
        class="w-full h-full object-cover"
        @error="handleImageError" 
      />
      <div 
        v-else 
        class="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"
      >
        <font-awesome-icon icon="music" class="text-white text-2xl" />
      </div>
      
      <!-- 播放指示器 -->
      <div 
        v-if="currentTrack.id === track.id && isPlaying" 
        class="absolute inset-0 bg-black/30 flex items-center justify-center"
      >
        <div class="bg-orange-500 text-white rounded-full p-2 animate-pulse">
          <font-awesome-icon icon="play" class="text-sm" />
        </div>
      </div>
      
      <!-- 載入指示器 -->
      <div 
        v-if="currentTrack.id === track.id && isLoadingTrack" 
        class="absolute inset-0 bg-black/30 flex items-center justify-center"
      >
        <div class="bg-orange-500 text-white rounded-full p-2">
          <font-awesome-icon icon="spinner" class="text-sm animate-spin" />
        </div>
      </div>
    </div>
    
    <!-- 歌曲信息 -->
    <div @click="$emit('track-click')" class="cursor-pointer">
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
</template>

<script setup>
defineProps({
  track: {
    type: Object,
    required: true
  },
  currentTrack: {
    type: Object,
    required: true
  },
  isPlaying: {
    type: Boolean,
    required: true
  },
  isLoadingTrack: {
    type: Boolean,
    required: true
  },
  isFavorite: {
    type: Boolean,
    required: true
  }
})

defineEmits(['track-click', 'toggle-favorite'])

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
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

.music-card {
  transition: all 0.3s ease;
}

.music-card:hover {
  transform: translateY(-2px);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .music-card {
    padding: 0.5rem;
  }
  
  .h-24 {
    height: 4rem;
  }
  
  .text-sm {
    font-size: 0.75rem;
  }
  
  .text-xs {
    font-size: 0.65rem;
  }
}

@media (max-width: 480px) {
  .music-card {
    padding: 0.25rem;
  }
  
  .h-24 {
    height: 3rem;
  }
  
  .p-2 {
    padding: 0.25rem;
  }
}
</style>