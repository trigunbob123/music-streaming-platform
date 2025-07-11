<template>
  <div class="member-login-container">
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
        <font-awesome-icon icon="user" class="mr-2 text-blue-600" />
        會員登入
      </h2>
    </div>

    <!-- 登入表單 -->
    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- 帳號輸入框 -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">帳號</label>
        <input
          id="username"
          v-model="loginForm.username"
          type="text"
          placeholder="請輸入帳號"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          required
          autocomplete="username"
        />
      </div>

      <!-- 密碼輸入框 -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">密碼</label>
        <input
          id="password"
          v-model="loginForm.password"
          type="password"
          placeholder="請輸入密碼"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          required
          autocomplete="current-password"
        />
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
        {{ errorMessage }}
      </div>

      <!-- Google 登入按鈕 -->
      <div 
        id="google-signin-button"
        class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>使用 Google 登入</span>
      </div>

      <!-- 登入按鈕 -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        <font-awesome-icon v-if="isLoading" icon="spinner" class="animate-spin mr-2" />
        {{ isLoading ? '登入中...' : '登入' }}
      </button>

      <!-- 註冊會員按鈕 -->
      <button
        type="button"
        @click="$emit('switch-to-register')"
        :disabled="isLoading"
        class="w-full flex items-center justify-center px-4 py-3 border border-orange-500 rounded-lg bg-white text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50"
      >
        <font-awesome-icon icon="user-plus" class="mr-2" />
        註冊會員
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['close', 'login-success', 'switch-to-register'])

// 登入表單數據
const loginForm = ref({
  username: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

// Google 登入設置
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

// 初始化 Google 登入
const initializeGoogleSignIn = () => {
  if (!googleClientId) {
    console.warn('⚠️ Google Client ID 未設置')
    return
  }

  // 動態載入 Google Identity Services 腳本
  if (!window.google) {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      setupGoogleSignIn()
    }
    document.head.appendChild(script)
  } else {
    setupGoogleSignIn()
  }
}

// 設置 Google 登入
const setupGoogleSignIn = () => {
  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: handleGoogleResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  })

  // 渲染 Google 登入按鈕
  window.google.accounts.id.renderButton(
    document.getElementById('google-signin-button'),
    {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signin_with',
      shape: 'rectangular'
    }
  )
}

// 處理 Google 登入回應
const handleGoogleResponse = async (response) => {
  try {
    // 解析 JWT token
    const responsePayload = parseJwt(response.credential)
    
    console.log('Google 登入成功:', responsePayload)
    
    const userData = {
      username: responsePayload.name,
      email: responsePayload.email,
      picture: responsePayload.picture,
      loginType: 'google',
      googleId: responsePayload.sub
    }
    
    // 儲存到 localStorage
    localStorage.setItem('user', JSON.stringify(userData))
    
    emit('login-success', userData)
  } catch (error) {
    console.error('Google 登入處理失敗:', error)
    errorMessage.value = 'Google 登入失敗，請稍後再試'
  }
}

// 解析 JWT token
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('JWT 解析失敗:', error)
    throw error
  }
}

// 處理一般登入
const handleLogin = async () => {
  if (!loginForm.value.username.trim() || !loginForm.value.password.trim()) {
    errorMessage.value = '請輸入帳號和密碼'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 模擬登入API調用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 檢查已註冊的用戶
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
    const user = registeredUsers.find(u => 
      u.username === loginForm.value.username.trim() && u.password === loginForm.value.password.trim()
    )
    
    if (user || (loginForm.value.username.trim() === 'demo' && loginForm.value.password.trim() === 'password')) {
      const userData = user || {
        username: loginForm.value.username.trim(),
        email: 'demo@example.com',
        loginType: 'normal'
      }
      
      // 儲存到 localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      
      emit('login-success', userData)
      
      // 重置表單
      loginForm.value = { username: '', password: '' }
    } else {
      errorMessage.value = '帳號或密碼錯誤，請檢查後重新輸入'
    }
  } catch (error) {
    errorMessage.value = '登入失敗，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 組件掛載時初始化 Google 登入
onMounted(() => {
  initializeGoogleSignIn()
})
</script>

<style scoped>
.member-login-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
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
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
.member-login-container > button:first-child {
  transition: all 0.2s ease;
}

.member-login-container > button:first-child:hover {
  background-color: #f3f4f6;
  transform: none;
}
</style>