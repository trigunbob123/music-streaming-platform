<template>
  <div class="member-register-container">
    <!-- 關閉按鈕 X -->
    <button
      @click="$emit('close')"
      class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
    >
      ✕
    </button>

    <!-- 標題區域 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800 flex items-center">
        <font-awesome-icon icon="user-plus" class="mr-2 text-green-600" />
        註冊會員
      </h2>
    </div>

    <!-- 註冊表單 -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <!-- 帳號輸入框 -->
      <div>
        <label for="register-username" class="block text-sm font-medium text-gray-700 mb-2">帳號</label>
        <input
          id="register-username"
          v-model="registerForm.username"
          type="text"
          placeholder="請輸入帳號"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
          required
          autocomplete="username"
        />
      </div>

      <!-- 密碼輸入框 -->
      <div>
        <label for="register-password" class="block text-sm font-medium text-gray-700 mb-2">密碼</label>
        <input
          id="register-password"
          v-model="registerForm.password"
          type="password"
          placeholder="請輸入密碼"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
          required
          autocomplete="new-password"
        />
      </div>

      <!-- 確認密碼輸入框 -->
      <div>
        <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">確認密碼</label>
        <input
          id="confirm-password"
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="請再次輸入密碼"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
          required
          autocomplete="new-password"
        />
      </div>

      <!-- Email 輸入框 -->
      <div>
        <label for="register-email" class="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
        <input
          id="register-email"
          v-model="registerForm.email"
          type="email"
          placeholder="請輸入電子郵件"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
          required
          autocomplete="email"
        />
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
        {{ errorMessage }}
      </div>

      <!-- 成功訊息 -->
      <div v-if="successMessage" class="text-green-500 text-sm bg-green-50 p-3 rounded-lg">
        {{ successMessage }}
      </div>

      <!-- 按鈕區域 -->
      <div class="flex space-x-3">
        <!-- 會員登入按鈕 -->
        <button
          type="button"
          @click="$emit('switch-to-login')"
          :disabled="isLoading"
          class="flex-1 flex items-center justify-center px-4 py-3 border border-blue-500 rounded-lg bg-white text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <font-awesome-icon icon="sign-in-alt" class="mr-2" />
          會員登入
        </button>

        <!-- 註冊按鈕 -->
        <button
          type="submit"
          :disabled="isLoading"
          class="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <font-awesome-icon v-if="isLoading" icon="spinner" class="animate-spin mr-2" />
          {{ isLoading ? '註冊中...' : '註冊' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close', 'register-success', 'switch-to-login'])

// 註冊表單數據
const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 處理註冊
const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // 驗證表單
  if (!registerForm.value.username.trim() || !registerForm.value.password.trim() || 
      !registerForm.value.confirmPassword.trim() || !registerForm.value.email.trim()) {
    errorMessage.value = '請填寫所有必填欄位'
    return
  }

  if (registerForm.value.password.trim() !== registerForm.value.confirmPassword.trim()) {
    errorMessage.value = '密碼與確認密碼不一致'
    return
  }

  if (registerForm.value.password.trim().length < 6) {
    errorMessage.value = '密碼長度至少需要 6 個字符'
    return
  }

  // 簡單的 Email 格式驗證
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.value.email.trim())) {
    errorMessage.value = '請輸入有效的電子郵件格式'
    return
  }

  isLoading.value = true

  try {
    // 模擬註冊API調用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 儲存註冊資料到 localStorage
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
    
    // 檢查帳號是否已存在
    if (registeredUsers.find(user => user.username === registerForm.value.username.trim())) {
      errorMessage.value = '此帳號已存在，請選擇其他帳號'
      return
    }

    // 檢查 Email 是否已存在
    if (registeredUsers.find(user => user.email === registerForm.value.email.trim())) {
      errorMessage.value = '此電子郵件已被註冊，請使用其他郵件'
      return
    }
    
    registeredUsers.push({
      username: registerForm.value.username.trim(),
      password: registerForm.value.password.trim(),
      email: registerForm.value.email.trim(),
      registerDate: new Date().toISOString()
    })
    
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers))
    
    successMessage.value = '註冊成功！3秒後將自動跳轉到登入頁面'
    
    emit('register-success', {
      username: registerForm.value.username.trim(),
      email: registerForm.value.email.trim()
    })

    // 3秒後自動跳轉到登入頁面
    setTimeout(() => {
      emit('switch-to-login')
    }, 3000)
    
    // 重置表單
    registerForm.value = {
      username: '',
      password: '',
      confirmPassword: '',
      email: ''
    }
    
  } catch (error) {
    errorMessage.value = '註冊失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.member-register-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 確保輸入框樣式正確 */
input {
  color: #1f2937 !important;
  background-color: white !important;
}

input:focus {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

input::placeholder {
  color: #9ca3af;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* 關閉按鈕樣式 */
.member-register-container > button:first-child {
  transition: all 0.2s ease;
}

.member-register-container > button:first-child:hover {
  background-color: #f3f4f6;
  transform: none;
}
</style>