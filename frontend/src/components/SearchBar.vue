<template>
  <div class="relative inline-block w-full">
    <input 
      :value="searchQuery"
      @input="$emit('update:searchQuery', $event.target.value); $emit('search')"
      placeholder="🔎搜尋歌曲、藝人或專輯..." 
      class="w-full py-1 my-0 px-4 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>
</template>

<script setup>
defineProps({
  searchQuery: {
    type: String,
    required: true
  }
})

defineEmits(['update:searchQuery', 'search'])
</script>

<style scoped>
input {
  transition: all 0.2s ease;
}

input:focus {
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  border-color: #f97316;
}

input::placeholder {
  color: #6b7280;
}
</style>