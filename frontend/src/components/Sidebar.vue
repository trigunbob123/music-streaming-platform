<template>
  <div class="w-64 sidebar text-white p-10">
    <div class="flex items-center justify-between mb-8">
      <!-- 只顯示 logo，移除連接狀態 -->
      <div class="flex items-center">
        <img src="@/assets/images/12.png" alt="DDM360" class="h-auto w-25" />
      </div>
      <!-- 連接按鈕區域 -->
      <div class="flex space-x-2">
        <button 
          v-if="!isJamendoConnected && jamendoConfigured" 
          @click="$emit('connect-jamendo')" 
          class="text-orange-400 hover:text-orange-300 text-sm"
        >
          <font-awesome-icon icon="music" class="mr-1" />
          連接 Jamendo
        </button>
        <span v-else-if="!jamendoConfigured" class="text-gray-400 text-xs">
          Jamendo 未配置
        </span>
      </div>
    </div>

    <nav class="space-y-4 mb-8">
      <button 
        @click="$emit('set-mode', 'random')" 
        class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
        :class="{ 'bg-gray-700': currentMode === 'random' }"
      >
        <font-awesome-icon icon="random" class="mr-3" />
        隨機播放
      </button>
      <button 
        @click="$emit('set-mode', 'latest')" 
        class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
        :class="{ 'bg-gray-700': currentMode === 'latest' }"
      >
        <font-awesome-icon icon="music" class="mr-3" />
        最新音樂
      </button>
      <button 
        @click="$emit('set-mode', 'popular')" 
        class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
        :class="{ 'bg-gray-700': currentMode === 'popular' }"
      >
        <font-awesome-icon icon="fire" class="mr-3" />
        熱門歌曲
      </button>
      <button 
        @click="$emit('set-mode', 'favorites')" 
        class="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
        :class="{ 'bg-gray-700': currentMode === 'favorites' }"
      >
        <font-awesome-icon icon="heart" class="mr-3 cursor-pointer" />
        我的收藏
      </button>
    </nav>
  </div>
</template>

<script setup>
defineProps({
  isJamendoConnected: {
    type: Boolean,
    required: true
  },
  jamendoConfigured: {
    type: Boolean,
    required: true
  },
  currentMode: {
    type: String,
    required: true
  }
})

defineEmits(['connect-jamendo', 'set-mode'])
</script>

<style scoped>
.sidebar {
  background: linear-gradient(135deg, #000000 0%, #764ba2 100%);
  min-height: 100vh;
  height: auto;
}

.w-25 {
  width: 6.25rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .w-64 { 
    width: 12rem; 
  }
  
  .p-10 {
    padding: 1.5rem;
  }
  
  .text-sm {
    font-size: 0.75rem;
  }
}
</style>