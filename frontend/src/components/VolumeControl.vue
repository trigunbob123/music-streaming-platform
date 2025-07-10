<template>
  <div class="flex items-center space-x-2">
    <button class="btn btn-circle bg-transparent text-white hover:bg-gray-700">
      <font-awesome-icon :icon="getVolumeIcon()" class="text-lg" />
    </button>
    <input 
      type="range" 
      min="0" 
      max="100" 
      :value="volume"
      @input="$emit('volume-change', $event)"
      class="volume-slider w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
    />
    <span class="text-xs text-gray-300 volume-text">{{ volume }}%</span>
  </div>
</template>

<script setup>
const props = defineProps({
  volume: {
    type: Number,
    required: true
  }
})

defineEmits(['volume-change'])

const getVolumeIcon = () => {
  if (props.volume === 0) return 'volume-mute'
  if (props.volume < 30) return 'volume-down'
  if (props.volume < 70) return 'volume-down'
  return 'volume-up'
}
</script>

<style scoped>
.btn {
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-circle {
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:hover {
  transform: scale(1.05);
}

.volume-text {
  width: 2rem;
  text-align: left;
}

.volume-slider {
  background: linear-gradient(90deg, #ff6b35, #f7931e);
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .btn-circle {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .volume-slider {
    width: 4rem;
  }
  
  .volume-text {
    width: 1.5rem;
    font-size: 0.65rem;
  }
}
</style>