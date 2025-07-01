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
  faVolumeDown,
  faRandom, 
  faMusic, 
  faStar, 
  faVideo, 
  faHeartBroken,
  faHeart as faHeartSolid,  // 實心愛心，重新命名
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
  faSpinner  // 🔧 新增：旋轉載入圖標
} from '@fortawesome/free-solid-svg-icons'

// 新增空心圖標
import { 
  faHeart as faHeartRegular  // 空心愛心
} from '@fortawesome/free-regular-svg-icons'

import { 
  faFacebook, 
  faTwitter,
  faSpotify
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
  faHeartBroken,
  faStar, 
  faVideo, 
  faHeartSolid,    // 實心愛心
  faHeartRegular,  // 空心愛心
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
  faSpinner,       // 🔧 新增
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