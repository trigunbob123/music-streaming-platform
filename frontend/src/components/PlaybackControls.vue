<template>
  <div class="play-controls-container">
    <button 
      @click="$emit('previous-track')" 
      class="control-button" 
      :disabled="!currentTrack.name || isLoadingTrack"
    >
      <font-awesome-icon icon="step-backward" class="text-lg" />
    </button>
    
    <button 
      @click="$emit('toggle-play')" 
      class="control-button" 
      :disabled="!currentTrack.name"
    >
      <font-awesome-icon 
        v-if="isLoadingTrack" 
        icon="spinner" 
        class="text-lg animate-spin" 
      />
      <font-awesome-icon 
        v-else 
        :icon="isPlaying ? 'pause' : 'play'" 
        class="text-lg" 
      />
    </button>
    
    <button 
      @click="$emit('next-track')" 
      class="control-button" 
      :disabled="!currentTrack.name || isLoadingTrack"
    >
      <font-awesome-icon icon="step-forward" class="text-lg" />
    </button>
  </div>
</template>

<script setup>
defineProps({
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
  }
})

defineEmits(['toggle-play', 'previous-track', 'next-track'])
</script>

<style scoped>
/* 播放控制按鈕 */
.play-controls-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 1rem;
}

/* 播放控制按鈕 */
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
}

.control-button:hover:not(:disabled) {
  background-color: #f9bc66;
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>