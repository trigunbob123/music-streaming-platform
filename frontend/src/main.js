import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import './assets/styles/main.css'

// FontAwesome 圖標
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { 
  faPlay, 
  faPause, 
  faVolumeUp, 
  faVolumeMute,
  faVolumeDown,  // 新增
  faRandom, 
  faMusic, 
  faStar, 
  faVideo, 
  faHeart,
  faList, 
  faSearch, 
  faUser, 
  faHome, 
  faChevronDown, 
  faLink,
  faExclamationTriangle,
  faStepBackward,  // 新增
  faStepForward,   // 新增
  faRepeat,        // 新增
  faRedo,          // 新增
  faFire           // 新增
} from '@fortawesome/free-solid-svg-icons'

import { 
  faFacebook, 
  faTwitter,
  faSpotify        // 新增 Spotify 圖標
} from '@fortawesome/free-brands-svg-icons'

// 添加圖標到庫
library.add(
  faPlay, 
  faPause, 
  faVolumeUp, 
  faVolumeMute,
  faVolumeDown,
  faRandom, 
  faMusic, 
  faStar, 
  faVideo, 
  faHeart,
  faList, 
  faSearch, 
  faUser, 
  faHome, 
  faChevronDown, 
  faLink,
  faExclamationTriangle,
  faStepBackward,
  faStepForward,
  faRepeat,
  faRedo,
  faFire,
  faFacebook, 
  faTwitter,
  faSpotify
)

const app = createApp(App)

// 配置 Pinia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)

// 註冊 FontAwesome 組件
app.component('font-awesome-icon', FontAwesomeIcon)

// 直接掛載，不使用路由器
app.mount('#app')

console.log('🚀 Vue 應用已啟動')