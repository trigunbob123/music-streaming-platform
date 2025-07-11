<template>
  <div class="sidebar text-white p-10">
    <div class="flex items-center justify-between mb-8">
      
      <div class="flex items-center">
        <img src="@/assets/images/12.png" alt="DDM360" class="h-auto w-25" />
      </div>
      
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
/* 🔧 修改：確保側邊欄背景延伸到與內容區域底部齊平 */
.sidebar {
  background: linear-gradient(rgba(4, 5, 8, 0.7), rgba(61, 2, 116, 0.9)), 
              url('@/assets/images/58.jpg');
  /* background: linear-gradient(135deg, #000000 0%, #940d53 100%); */
  width: 16rem; /* w-64 = 256px = 16rem */
  min-height: 100vh; /* 至少保持全螢幕高度 */
  height: auto; /* 根據內容自動調整 */
  flex-shrink: 0; /* 防止側邊欄被壓縮 */
  display: flex;
  flex-direction: column;
  align-self: stretch; /* 讓側邊欄撐滿父容器高度 */
}

.w-25 {
  width: 6.25rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .sidebar { 
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