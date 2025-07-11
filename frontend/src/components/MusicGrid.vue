<template>
  <div class="grid grid-cols-6 gap-4">
    <MusicCard
      v-for="track in displayedTracks" 
      :key="track.id"
      :track="track"
      :current-track="currentTrack"
      :is-playing="isPlaying"
      :is-loading-track="isLoadingTrack"
      :is-favorite="isFavorite(track.id)"
      @track-click="$emit('track-click', track)"
      @toggle-favorite="$emit('toggle-favorite', track)"
    />
    
    <!-- 未連接 Jamendo 提示 -->
    <div 
      v-if="!isJamendoConnected && jamendoConfigured" 
      class="col-span-6 text-center py-16 text-gray-500"
    >
      <font-awesome-icon icon="music" class="text-6xl mb-4 text-orange-400" />
      <h3 class="text-xl font-medium mb-2">連接 Jamendo</h3>
      <p class="text-sm mb-4">連接 Jamendo 來播放免費的 Creative Commons 音樂</p>
      <button 
        @click="$emit('connect-jamendo')" 
        class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        <font-awesome-icon icon="music" class="mr-2" />
        連接 Jamendo
      </button>
    </div>

    <!-- Jamendo 未配置提示 -->
    <div 
      v-else-if="!jamendoConfigured" 
      class="col-span-6 text-center py-16 text-gray-500"
    >
      <font-awesome-icon icon="music" class="text-6xl mb-4 text-gray-400" />
      <h3 class="text-xl font-medium mb-2">Jamendo 未配置</h3>
      <p class="text-sm mb-4">請在環境變數中設置 VITE_JAMENDO_CLIENT_ID</p>
    </div>
    
    <!-- 無歌曲提示 -->
    <div 
      v-else-if="!loading && displayedTracks.length === 0" 
      class="col-span-6 text-center py-16 text-gray-300"
    >
      <font-awesome-icon 
        :icon="currentMode === 'favorites' ? 'heart' : 'search'" 
        class="text-6xl mb-4 text-gray-300" 
      />
      <h3 class="text-xl font-medium mb-2">
        {{ currentMode === 'favorites' ? '還沒有收藏' : '搜尋音樂' }}
      </h3>
      <p class="text-sm">
        {{ currentMode === 'favorites' ? '點擊歌曲右上角的愛心來收藏音樂' : '使用上方搜尋欄或點擊標籤按鈕來尋找音樂' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import MusicCard from './MusicCard.vue'

const props = defineProps({
  displayedTracks: {
    type: Array,
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
  favoriteTrackIds: {
    type: Set,
    required: true
  },
  isJamendoConnected: {
    type: Boolean,
    required: true
  },
  jamendoConfigured: {
    type: Boolean,
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  },
  currentMode: {
    type: String,
    required: true
  }
})

defineEmits(['track-click', 'toggle-favorite', 'connect-jamendo'])

const isFavorite = (trackId) => {
  return props.favoriteTrackIds.has(trackId)
}
</script>

<style scoped>
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
}
</style>