<!-- frontend/src/components/ErrorBoundary.vue -->
<template>
  <div v-if="hasError" class="error-container">
    <div class="error-card">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">出現錯誤</h3>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <button @click="retry" class="retry-btn">重試</button>
        <button @click="reset" class="reset-btn">重置</button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((error) => {
  console.error('Vue Error Captured:', error)
  hasError.value = true
  errorMessage.value = error.message || '未知錯誤'
  return false
})

const retry = () => {
  hasError.value = false
  errorMessage.value = ''
  window.location.reload()
}

const reset = () => {
  hasError.value = false
  errorMessage.value = ''
  // 清除本地存儲
  localStorage.clear()
  window.location.reload()
}
</script>

<style scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 2rem;
}

.error-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  color: #ef4444;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.error-message {
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.retry-btn, .reset-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.retry-btn {
  background: #f97316;
  color: white;
}

.retry-btn:hover {
  background: #ea580c;
}

.reset-btn {
  background: #e5e7eb;
  color: #374151;
}

.reset-btn:hover {
  background: #d1d5db;
}
</style>