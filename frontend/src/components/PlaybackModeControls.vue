<template>
  <div class="flex items-center space-x-2">
    <button 
      @click="$emit('toggle-shuffle')" 
      class="btn btn-circle bg-transparent text-white hover:bg-gray-700"
      :class="{ 'text-orange-400': isShuffled }"
    >
      <font-awesome-icon icon="random" class="text-lg" />
    </button>
    <button 
      @click="$emit('toggle-repeat')" 
      class="btn btn-circle bg-transparent text-white hover:bg-gray-700"
      :class="{ 'text-orange-400': repeatMode !== 'off' }"
    >
      <font-awesome-icon 
        :icon="repeatMode === 'one' ? 'redo' : 'repeat'" 
        class="text-lg" 
      />
    </button>
  </div>
</template>

<script setup>
defineProps({
  isShuffled: {
    type: Boolean,
    required: true
  },
  repeatMode: {
    type: String,
    required: true
  }
})

defineEmits(['toggle-shuffle', 'toggle-repeat'])
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

/* 響應式設計 */
@media (max-width: 768px) {
  .btn-circle {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .text-lg {
    font-size: 1rem;
  }
}
</style>