import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import './style.css'

// FontAwesome 圖標
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
  faPlay, faPause, faVolumeUp, faVolumeMute, 
  faRandom, faMusic, faStar, faVideo, faHeart,
  faList, faSearch, faUser, faHome
} from '@fortawesome/free-solid-svg-icons'
import { 
  faFacebook, faTwitter 
} from '@fortawesome/free-brands-svg-icons'

// 添加圖標到庫
library.add(
  faPlay, faPause, faVolumeUp, faVolumeMute,
  faRandom, faMusic, faStar, faVideo, faHeart,
  faList, faSearch, faUser, faHome,
  faFacebook, faTwitter
)

const app = createApp(App)

// 配置 Pinia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

// 註冊 FontAwesome 組件
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')