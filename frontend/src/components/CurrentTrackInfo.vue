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
    <div class="min-w-0 flex-1 max-w-xs">
      <p 
        class="font-medium text-lg leading-tight max-h-12 overflow-hidden" 
        :title="currentTrack.name"
        style="line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;"
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
        class="text-xs text-orange-400 truncate" 
        v-if="currentTrack.album_name" 
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
defineProps({
  currentTrack: {
    type: Object,
    required: true
  }
})

const handleImageError = (event) => {
  event.target.style.display = 'none'
}
</script>