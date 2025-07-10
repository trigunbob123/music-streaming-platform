<template>
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-600 flex items-center ">
      <font-awesome-icon icon="heart" class="mr-2 text-red-500" />
      我的收藏 ({{ favoriteCount }} 首)
    </h2>
    <p class="text-gray-600 text-sm mt-1 ">你收藏的音樂清單</p>
  </div>
</template>

<script setup>
defineProps({
  favoriteCount: {
    type: Number,
    required: true
  }
})
</script>