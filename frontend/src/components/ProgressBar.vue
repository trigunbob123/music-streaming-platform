<template>
  <div class="flex items-center space-x-2" style="min-width: 170px;">
    <span class="text-xs text-gray-300 w-12 text-right">{{ formatTime(currentTime) }}</span>
    <div 
      class="flex-1 bg-gray-600 rounded-full h-2 cursor-pointer relative" 
      @click="$emit('seek', $event)"
    >
      <div 
        class="progress-bar h-2 rounded-full absolute top-0 left-0" 
        :style="{ width: progressPercentage + '%' }"
      ></div>
    </div>
    <span class="text-xs text-gray-300 w-6">{{ formatTime(duration) }}</span>
  </div>
</template>

<script setup>
defineProps({
  currentTime: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  progressPercentage: {
    type: Number,
    required: true
  }
})

defineEmits(['seek'])

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.progress-bar {
  background: linear-gradient(90deg, #b03407, #f4870a, #fccc6a);
  box-shadow: 0 0 4px rgba(255, 171, 0, 0.3);
}
</style>