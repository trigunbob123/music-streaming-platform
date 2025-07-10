import { ref, onMounted, onUnmounted } from 'vue'

export function useJamendo() {
  // 基本配置
  const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID
  const API_BASE = import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD 
      ? window.location.origin  // Railway 生產環境使用當前域名
      : 'http://127.0.0.1:8000'  // 本地開發環境
  )
  
  // 狀態管理
  const isJamendoConnected = ref(false)
  const audioPlayer = ref(null)
  const jamendoConfigured = ref(false)
  
  // 播放狀態
  const currentTrack = ref({})
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(50)
  const isShuffled = ref(false)
  const repeatMode = ref('off') // 'off', 'all', 'one'
  
  // 播放列表管理
  const currentPlaylist = ref([])
  const currentTrackIndex = ref(0)
  const autoPlayNext = ref(true)
  
  // 錯誤處理
  const lastError = ref('')
  
  // 🔧 新增：播放狀態管理，防止競爭條件
  const isLoadingTrack = ref(false)
  const currentPlayPromise = ref(null)
  const playbackState = ref('idle') // 'idle', 'loading', 'playing', 'paused', 'error'

  // 🆕 新增：音頻格式驗證和備用 URL 處理
  const getSupportedAudioUrl = (track) => {
    // 優先順序：MP3 > OGG > 原始 URL
    const audioUrls = []
    
    // 檢查不同的音頻 URL 屬性
    if (track.audio) audioUrls.push(track.audio)
    if (track.audiodownload) audioUrls.push(track.audiodownload)
    if (track.audiodownload_allowed && track.shorturl) {
      audioUrls.push(track.shorturl + '/download/')
    }
    
    // 過濾並排序 URL (優先 MP3)
    const validUrls = audioUrls.filter(url => url && typeof url === 'string')
    const mp3Urls = validUrls.filter(url => url.toLowerCase().includes('.mp3') || url.toLowerCase().includes('mp3'))
    const otherUrls = validUrls.filter(url => !url.toLowerCase().includes('.mp3'))
    
    console.log('🔗 找到的音頻 URLs:', { mp3Urls, otherUrls, allUrls: validUrls })
    
    return [...mp3Urls, ...otherUrls]
  }

  // 🆕 新增：改進的音頻 URL 測試機制
  const testAudioUrl = async (url, quickTest = false) => {
    return new Promise((resolve) => {
      // 如果是快速測試模式，跳過實際測試，只驗證 URL 格式
      if (quickTest) {
        try {
          new URL(url)
          console.log('✅ URL 格式有效 (快速測試):', url)
          resolve(true)
        } catch (error) {
          console.warn('❌ URL 格式無效:', url, error.message)
          resolve(false)
        }
        return
      }
      
      const testAudio = new Audio()
      const timeout = setTimeout(() => {
        testAudio.src = ''
        console.warn('⏰ URL 測試超時:', url)
        resolve(false)
      }, 2000) // 減少到 2 秒超時
      
      testAudio.addEventListener('canplay', () => {
        clearTimeout(timeout)
        testAudio.src = ''
        console.log('✅ URL 測試通過:', url)
        resolve(true)
      }, { once: true })
      
      testAudio.addEventListener('error', (e) => {
        clearTimeout(timeout)
        testAudio.src = ''
        console.warn('❌ URL 測試失敗:', url, e.target?.error?.message || '未知錯誤')
        resolve(false)
      }, { once: true })
      
      try {
        testAudio.src = url
        testAudio.load()
      } catch (error) {
        clearTimeout(timeout)
        console.warn('❌ URL 設置失敗:', url, error.message)
        resolve(false)
      }
    })
  }

  // 檢查配置
  const checkConfig = async () => {
    try {
      console.log('🚂 檢查 Railway Jamendo 配置...')
      
      // Railway 環境使用健康檢查端點
      const configEndpoint = import.meta.env.PROD 
        ? `${API_BASE}/api/health/`
        : `${API_BASE}/api/jamendo/config/`
      
      const response = await fetch(configEndpoint)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const config = await response.json()
      
      if (import.meta.env.PROD) {
        // 生產環境：檢查健康狀態和功能
        jamendoConfigured.value = config.status === 'healthy' && 
                                config.features?.jamendo_integration === true
        
        console.log('✅ Railway 健康檢查通過:', {
          status: config.status,
          environment: config.environment,
          jamendo: config.features?.jamendo_integration
        })
      } else {
        // 開發環境：檢查詳細配置
        jamendoConfigured.value = config.available && config.status === 'configured'
        
        console.log('✅ 開發環境 Jamendo 配置:', config)
      }
      
      return jamendoConfigured.value
    } catch (error) {
      console.error('❌ Jamendo 配置檢查失敗:', error)
      jamendoConfigured.value = false
      return false
    }
  }

  // 🔧 改進的音頻播放器初始化
  const initializePlayer = () => {
    try {
      // 先宣告所有事件處理函數
      const onLoadStart = () => {
        console.log('🎵 開始載入音頻')
        isLoadingTrack.value = true
        playbackState.value = 'loading'
      }
      
      const onCanPlay = () => {
        console.log('🎵 音頻可以播放')
        duration.value = Math.floor(audioPlayer.value.duration || 0)
        isLoadingTrack.value = false
        if (playbackState.value === 'loading') {
          playbackState.value = 'idle'
        }
      }
      
      const onPlay = () => {
        console.log('▶️ 音頻開始播放')
        isPlaying.value = true
        playbackState.value = 'playing'
      }
      
      const onPause = () => {
        console.log('⏸️ 音頻暫停')
        isPlaying.value = false
        playbackState.value = 'paused'
      }
      
      const onTimeUpdate = () => {
        currentTime.value = Math.floor(audioPlayer.value.currentTime || 0)
      }
      
      const onEnded = () => {
        console.log('🎵 歌曲播放結束')
        isPlaying.value = false
        playbackState.value = 'idle'
        currentPlayPromise.value = null
        
        if (autoPlayNext.value) {
          handleTrackEnd()
        }
      }
      
      const onError = (e) => {
        console.error('❌ 音頻播放錯誤:', e)
        
        // 🆕 改進的錯誤訊息處理
        let errorMessage = '音頻載入失敗'
        if (e.target && e.target.error) {
          const mediaError = e.target.error
          switch (mediaError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = '音頻載入被中止'
              break
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = '網路錯誤'
              break
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = '音頻格式不支援或文件損壞'
              break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = '音頻格式不支援'
              break
            default:
              errorMessage = '未知的音頻錯誤'
          }
        }
        
        lastError.value = errorMessage
        isPlaying.value = false
        isLoadingTrack.value = false
        playbackState.value = 'error'
        currentPlayPromise.value = null
      }
      
      const onStalled = () => {
        console.warn('⚠️ 音頻載入停滯')
        isLoadingTrack.value = false
      }
      
      const onSuspend = () => {
        console.log('⏸️ 音頻載入暫停')
        isLoadingTrack.value = false
      }
      
      // 清理現有播放器
      if (audioPlayer.value) {
        audioPlayer.value.removeEventListener('loadstart', onLoadStart)
        audioPlayer.value.removeEventListener('canplay', onCanPlay)
        audioPlayer.value.removeEventListener('play', onPlay)
        audioPlayer.value.removeEventListener('pause', onPause)
        audioPlayer.value.removeEventListener('timeupdate', onTimeUpdate)
        audioPlayer.value.removeEventListener('ended', onEnded)
        audioPlayer.value.removeEventListener('error', onError)
        audioPlayer.value.removeEventListener('stalled', onStalled)
        audioPlayer.value.removeEventListener('suspend', onSuspend)
      }
      
      audioPlayer.value = new Audio()
      audioPlayer.value.volume = volume.value / 100
      audioPlayer.value.crossOrigin = "anonymous"
      audioPlayer.value.preload = "metadata"
      
      // 添加事件監聽器
      audioPlayer.value.addEventListener('loadstart', onLoadStart)
      audioPlayer.value.addEventListener('canplay', onCanPlay)
      audioPlayer.value.addEventListener('play', onPlay)
      audioPlayer.value.addEventListener('pause', onPause)
      audioPlayer.value.addEventListener('timeupdate', onTimeUpdate)
      audioPlayer.value.addEventListener('ended', onEnded)
      audioPlayer.value.addEventListener('error', onError)
      audioPlayer.value.addEventListener('stalled', onStalled)
      audioPlayer.value.addEventListener('suspend', onSuspend)
      
      console.log('✅ Jamendo 播放器初始化完成')
      
    } catch (error) {
      console.error('❌ 初始化播放器失敗:', error)
      lastError.value = '初始化播放器失敗'
      playbackState.value = 'error'
    }
  }

  // API 請求封裝
  const jamendoAPI = async (endpoint, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const url = `${API_BASE}/api/jamendo/${endpoint}${queryString ? '?' + queryString : ''}`
      
      if (!import.meta.env.PROD) {
        console.log('🔄 Railway Jamendo API 請求:', endpoint, params)
      }
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'  // Railway 同域請求
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      if (!import.meta.env.PROD) {
        console.log('✅ Railway Jamendo API 響應:', data)
      }
      
      return data
    } catch (error) {
      if (!import.meta.env.PROD) {
        console.error('❌ Railway Jamendo API 請求失敗:', error)
      }
      lastError.value = error.message
      throw error
    }
  }

  // 🔧 改進的安全播放函數 - 核心修復
  const safePlay = async () => {
    try {
      // 檢查音頻元素狀態
      if (!audioPlayer.value || !audioPlayer.value.src) {
        throw new Error('音頻元素未準備就緒')
      }
      
      // 如果正在播放中，先安全停止
      if (currentPlayPromise.value) {
        try {
          audioPlayer.value.pause()
          await currentPlayPromise.value.catch(() => {})
        } catch (e) {
          console.log('🔄 清理舊的播放 Promise')
        }
        currentPlayPromise.value = null
      }
      
      // 確保音頻完全暫停
      if (!audioPlayer.value.paused) {
        audioPlayer.value.pause()
        // 等待暫停完成
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // 檢查音頻是否準備就緒
      if (audioPlayer.value.readyState < 2) {
        console.log('⏳ 等待音頻準備就緒...')
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('音頻準備超時'))
          }, 5000)
          
          const checkReady = () => {
            if (audioPlayer.value.readyState >= 2) {
              clearTimeout(timeout)
              resolve()
            } else if (audioPlayer.value.error) {
              clearTimeout(timeout)
              reject(new Error('音頻錯誤: ' + (audioPlayer.value.error.message || '未知錯誤')))
            } else {
              setTimeout(checkReady, 100)
            }
          }
          checkReady()
        })
      }
      
      // 🔧 檢查音頻是否已損壞
      if (audioPlayer.value.error) {
        throw new Error('音頻文件損壞: ' + (audioPlayer.value.error.message || '未知錯誤'))
      }
      
      // 開始播放
      console.log('▶️ 開始安全播放')
      currentPlayPromise.value = audioPlayer.value.play()
      await currentPlayPromise.value
      
      console.log('✅ 播放成功')
      currentPlayPromise.value = null
      
    } catch (error) {
      currentPlayPromise.value = null
      
      // 🔧 靜默處理常見的播放中斷錯誤
      if (error.name === 'AbortError' || 
          error.message.includes('interrupted') || 
          error.message.includes('pause()')) {
        console.log('🔄 播放被中斷，這是正常的操作')
        return
      }
      
      // 🔧 處理音頻相關錯誤
      if (error.name === 'NotSupportedError' || error.message.includes('format')) {
        console.error('❌ 音頻格式不支援:', error)
        throw new Error('音頻格式不支援')
      }
      
      if (error.name === 'NotAllowedError') {
        console.error('❌ 播放被阻止（可能需要用戶交互）:', error)
        throw new Error('請先點擊頁面任意位置啟用音頻播放')
      }
      
      console.error('❌ 播放失敗:', error)
      throw error
    }
  }

  // 🔧 改進的安全暫停函數
  const safePause = async () => {
    try {
      // 如果有未完成的播放 Promise，等待它完成或取消
      if (currentPlayPromise.value) {
        try {
          await currentPlayPromise.value.catch(() => {})
        } catch (e) {
          console.log('🔄 播放 Promise 已取消')
        }
        currentPlayPromise.value = null
      }
      
      // 暫停播放
      if (!audioPlayer.value.paused) {
        audioPlayer.value.pause()
        console.log('⏸️ 音頻已暫停')
      }
      
      // 等待暫停完成
      await new Promise(resolve => setTimeout(resolve, 50))
      
    } catch (error) {
      console.warn('⚠️ 暫停音頻時出錯:', error)
    }
  }

  // 🔧 徹底重寫的播放音軌函數
  const playTrack = async (track, playlistTracks = null, trackIndex = 0) => {
    try {
      console.log('🎵 準備播放:', track.name)
      
      // 防止重複載入
      if (playbackState.value === 'loading') {
        console.log('⏳ 正在載入中，忽略重複請求')
        return
      }
      
      if (!audioPlayer.value) {
        initializePlayer()
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // 如果是同一首歌且已經在播放，直接恢復播放
      if (currentTrack.value.id === track.id && 
          !audioPlayer.value.ended && 
          audioPlayer.value.src) {
        console.log('🎵 同一首歌，恢復播放')
        if (audioPlayer.value.paused) {
          await safePlay()
        }
        return
      }
      
      // 設置載入狀態
      isLoadingTrack.value = true
      playbackState.value = 'loading'
      lastError.value = ''
      
      // 設置播放列表
      if (playlistTracks) {
        setPlaylist(playlistTracks, trackIndex)
      }
      
      // 安全地停止當前播放
      await safePause()
      
      // 設置新的音軌
      currentTrack.value = track
      
      // 🆕 改進音頻 URL 驗證和備用處理
      const audioUrls = getSupportedAudioUrl(track)
      if (audioUrls.length === 0) {
        throw new Error('沒有可用的音頻 URL')
      }
      
      console.log('🔗 可用的音頻 URLs:', audioUrls)
      
      // 🆕 優化策略：先嘗試快速測試，如果都失敗再嘗試詳細測試
      let successfulUrl = null
      let attemptCount = 0
      
      // 第一輪：快速測試 (只驗證 URL 格式)
      for (const audioUrl of audioUrls) {
        attemptCount++
        try {
          console.log(`🔗 嘗試音頻 URL ${attemptCount}/${audioUrls.length} (快速測試):`, audioUrl)
          
          // 🔧 驗證 URL 格式
          new URL(audioUrl)
          
          // 🆕 快速測試 - 只檢查格式，不實際載入
          const isUrlValid = await testAudioUrl(audioUrl, true)
          if (!isUrlValid) {
            console.warn('⚠️ URL 格式無效，跳過:', audioUrl)
            continue
          }
          
          // 🔧 嘗試直接載入而不做複雜的預測試
          console.log('🎵 直接嘗試載入音頻:', audioUrl)
          
          // 🔧 重要：先重置音頻元素
          audioPlayer.value.src = ''
          audioPlayer.value.load()
          
          // 等待重置完成
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // 設置新的音頻源
          audioPlayer.value.src = audioUrl
          
          // 🔧 改進的音頻載入等待機制 - 更寬鬆的超時
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.warn('⏰ 音頻載入超時，嘗試下一個 URL:', audioUrl)
              reject(new Error('音頻載入超時'))
            }, 8000) // 8秒超時
            
            let resolved = false
            
            const onCanPlay = () => {
              if (resolved) return
              resolved = true
              clearTimeout(timeout)
              audioPlayer.value.removeEventListener('canplay', onCanPlay)
              audioPlayer.value.removeEventListener('error', onError)
              audioPlayer.value.removeEventListener('stalled', onStalled)
              audioPlayer.value.removeEventListener('loadeddata', onLoadedData)
              resolve()
            }
            
            const onLoadedData = () => {
              if (resolved) return
              console.log('📊 音頻數據已載入，準備播放:', audioUrl)
              // 如果有數據載入，也認為是成功的
              onCanPlay()
            }
            
            const onError = (e) => {
              if (resolved) return
              resolved = true
              clearTimeout(timeout)
              audioPlayer.value.removeEventListener('canplay', onCanPlay)
              audioPlayer.value.removeEventListener('error', onError)
              audioPlayer.value.removeEventListener('stalled', onStalled)
              audioPlayer.value.removeEventListener('loadeddata', onLoadedData)
              
              let errorMsg = '音頻載入失敗'
              if (e.target?.error) {
                const mediaError = e.target.error
                switch (mediaError.code) {
                  case MediaError.MEDIA_ERR_ABORTED:
                    errorMsg = '載入被中止'
                    break
                  case MediaError.MEDIA_ERR_NETWORK:
                    errorMsg = '網路錯誤'
                    break
                  case MediaError.MEDIA_ERR_DECODE:
                    errorMsg = '解碼錯誤'
                    break
                  case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMsg = '格式不支援'
                    break
                }
              }
              
              console.warn('❌ 音頻載入錯誤:', audioUrl, errorMsg)
              reject(new Error(errorMsg))
            }
            
            const onStalled = () => {
              console.warn('⚠️ 音頻載入停滯，等待恢復:', audioUrl)
              // 給更多時間等待網路恢復
              setTimeout(() => {
                if (!resolved) {
                  console.log('🔄 嘗試重新載入停滯的音頻:', audioUrl)
                  audioPlayer.value.load()
                }
              }, 3000)
            }
            
            // 監聽多個事件，提高成功率
            audioPlayer.value.addEventListener('canplay', onCanPlay, { once: true })
            audioPlayer.value.addEventListener('loadeddata', onLoadedData, { once: true })
            audioPlayer.value.addEventListener('error', onError, { once: true })
            audioPlayer.value.addEventListener('stalled', onStalled, { once: true })
            
            // 開始載入
            console.log('📥 開始載入音頻:', audioUrl)
            audioPlayer.value.load()
          })
          
          // 如果到這裡，說明 URL 可用
          successfulUrl = audioUrl
          console.log('✅ 成功載入音頻 URL:', successfulUrl)
          break
          
        } catch (urlError) {
          console.warn(`⚠️ URL ${attemptCount}/${audioUrls.length} 失敗，嘗試下一個:`, audioUrl, urlError.message)
          
          // 如果是最後一個 URL 且還沒成功，繼續嘗試
          if (attemptCount === audioUrls.length && !successfulUrl) {
            console.log('🔄 所有 URL 快速測試都失敗，嘗試更寬鬆的策略...')
            
            // 最後一招：嘗試第一個 URL 並直接播放，忽略預載入錯誤
            const fallbackUrl = audioUrls[0]
            try {
              console.log('🎯 緊急備用策略，使用第一個 URL:', fallbackUrl)
              audioPlayer.value.src = ''
              audioPlayer.value.load()
              await new Promise(resolve => setTimeout(resolve, 200))
              audioPlayer.value.src = fallbackUrl
              successfulUrl = fallbackUrl
              break
            } catch (fallbackError) {
              console.error('❌ 緊急備用策略也失敗:', fallbackError)
            }
          }
          continue
        }
      }
      
      // 如果所有 URL 都失敗了
      if (!successfulUrl) {
        // 🆕 最後嘗試：使用第一個看起來最有希望的 URL
        if (audioUrls.length > 0) {
          const lastAttemptUrl = audioUrls[0]
          console.log('🎲 最後嘗試使用第一個 URL (無預檢):', lastAttemptUrl)
          audioPlayer.value.src = lastAttemptUrl
          successfulUrl = lastAttemptUrl
        } else {
          throw new Error('沒有找到任何音頻 URL')
        }
      }
      
      // 設置音量
      audioPlayer.value.volume = volume.value / 100
      
      // 安全地開始播放
      await safePlay()
      
      console.log('✅ 成功播放:', track.name)
      
    } catch (error) {
      console.error('❌ 播放失敗:', error)
      
      // 🔧 改進錯誤處理 - 根據錯誤類型給出不同的提示
      let userFriendlyMessage = '播放失敗'
      
      if (error.message.includes('超時')) {
        userFriendlyMessage = '音頻載入超時，請檢查網路連接'
      } else if (error.message.includes('格式') || error.message.includes('decode') || error.message.includes('Format error')) {
        userFriendlyMessage = '音頻格式不支援，嘗試下一首歌曲'
      } else if (error.message.includes('網路') || error.message.includes('NETWORK')) {
        userFriendlyMessage = '網路連接問題'
      } else if (error.message.includes('URL') || error.message.includes('不可用')) {
        userFriendlyMessage = '音頻連結無效，嘗試下一首歌曲'
      }
      
      lastError.value = userFriendlyMessage
      isLoadingTrack.value = false
      playbackState.value = 'error'
      
      // 🔧 如果是播放清單模式，自動跳到下一首
      if (currentPlaylist.value.length > 1) {
        console.log('🔄 播放失敗，嘗試播放下一首...')
        setTimeout(async () => {
          try {
            await nextTrack()
          } catch (nextError) {
            console.error('❌ 跳到下一首也失敗:', nextError)
          }
        }, 1000)
      }
      
      console.warn('⚠️ 播放失敗，但不中斷用戶體驗:', error.message)
    } finally {
      isLoadingTrack.value = false
    }
  }

  // 🔧 改進的播放控制
  const togglePlay = async () => {
    try {
      if (!audioPlayer.value || !currentTrack.value.name) {
        console.warn('⚠️ 沒有可播放的音軌')
        return
      }
      
      if (isLoadingTrack.value) {
        console.log('⏳ 歌曲正在載入中，請稍候...')
        return
      }
      
      if (playbackState.value === 'loading') {
        console.log('⏳ 播放器正在載入，請稍候...')
        return
      }
      
      if (isPlaying.value) {
        await safePause()
      } else {
        await safePlay()
      }
    } catch (error) {
      console.error('❌ 切換播放狀態失敗:', error)
      lastError.value = '播放控制失敗: ' + error.message
    }
  }

  const previousTrack = async () => {
    try {
      if (currentPlaylist.value.length === 0) {
        console.warn('⚠️ 沒有播放列表')
        return
      }
      
      let prevIndex = currentTrackIndex.value - 1
      if (prevIndex < 0) {
        prevIndex = repeatMode.value === 'all' ? currentPlaylist.value.length - 1 : 0
      }
      
      currentTrackIndex.value = prevIndex
      const prevTrack = currentPlaylist.value[prevIndex]
      await playTrack(prevTrack)
      
    } catch (error) {
      console.error('❌ 上一首失敗:', error)
      lastError.value = '上一首失敗: ' + error.message
    }
  }

  const nextTrack = async () => {
    try {
      await playNextInPlaylist()
    } catch (error) {
      console.error('❌ 下一首失敗:', error)
      lastError.value = '下一首失敗: ' + error.message
    }
  }

  const seek = (event) => {
    if (!audioPlayer.value || !duration.value) return
    
    try {
      const rect = event.currentTarget.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const progressPercent = clickX / rect.width
      const newTime = progressPercent * duration.value
      
      audioPlayer.value.currentTime = newTime
      currentTime.value = Math.floor(newTime)
      console.log('🎯 跳轉到:', Math.floor(newTime), '秒')
    } catch (error) {
      console.error('❌ 跳轉失敗:', error)
    }
  }

  const setVolume = (volumePercent) => {
    if (!audioPlayer.value) return
    
    try {
      const newVolume = Math.max(0, Math.min(100, parseInt(volumePercent)))
      volume.value = newVolume
      audioPlayer.value.volume = newVolume / 100
      console.log('🔊 音量設置為:', newVolume + '%')
    } catch (error) {
      console.error('❌ 設置音量失敗:', error)
    }
  }

  const toggleShuffle = () => {
    isShuffled.value = !isShuffled.value
    console.log('🔀 隨機播放:', isShuffled.value ? '開啟' : '關閉')
  }

  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one']
    const currentIndex = modes.indexOf(repeatMode.value)
    repeatMode.value = modes[(currentIndex + 1) % modes.length]
    console.log('🔁 重複模式:', repeatMode.value)
  }

  // 播放列表管理
  const setPlaylist = (tracks, startIndex = 0) => {
    currentPlaylist.value = tracks
    currentTrackIndex.value = startIndex
    console.log('📋 設置播放列表:', tracks.length, '首歌曲')
  }

  const clearPlaylist = () => {
    currentPlaylist.value = []
    currentTrackIndex.value = 0
    console.log('📋 清除播放列表')
  }

  const playNextInPlaylist = async () => {
    if (currentPlaylist.value.length === 0) return
    
    try {
      let nextIndex = currentTrackIndex.value + 1
      
      // 處理重複模式
      if (repeatMode.value === 'one') {
        nextIndex = currentTrackIndex.value
      } else if (nextIndex >= currentPlaylist.value.length) {
        if (repeatMode.value === 'all') {
          nextIndex = 0
        } else {
          console.log('🎵 播放列表已結束')
          return
        }
      }
      
      // 處理隨機播放
      if (isShuffled.value && repeatMode.value !== 'one') {
        nextIndex = Math.floor(Math.random() * currentPlaylist.value.length)
      }
      
      currentTrackIndex.value = nextIndex
      const nextTrack = currentPlaylist.value[nextIndex]
      
      console.log('🎵 播放下一首:', nextTrack.name)
      await playTrack(nextTrack)
    } catch (error) {
      console.error('❌ 播放下一首失敗:', error)
    }
  }

  const handleTrackEnd = async () => {
    console.log('🎵 歌曲結束，嘗試播放下一首...')
    
    try {
      if (currentPlaylist.value.length > 0) {
        await playNextInPlaylist()
      }
    } catch (error) {
      console.error('❌ 自動播放下一首失敗:', error)
    }
  }

  // 搜尋音軌
  const searchTracks = async (query, options = {}) => {
    try {
      const params = {
        q: query,
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('search/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 搜尋失敗:', error)
      return []
    }
  }

  // 按標籤搜尋
  const getTracksByTag = async (tag, options = {}) => {
    try {
      const params = {
        tag: tag,
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('tracks/tag/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 按標籤搜尋失敗:', error)
      return []
    }
  }

  // 獲取熱門音軌
  const getPopularTracks = async (options = {}) => {
    try {
      const params = {
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('tracks/popular/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取熱門音軌失敗:', error)
      return []
    }
  }

  // 獲取最新音軌
  const getLatestTracks = async (options = {}) => {
    try {
      const params = {
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('tracks/latest/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取最新音軌失敗:', error)
      return []
    }
  }

  // 獲取隨機音軌
  const getRandomTracks = async (options = {}) => {
    try {
      const params = {
        limit: 50,
        ...options
      }
      
      const response = await jamendoAPI('tracks/random/', params)
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取隨機音軌失敗:', error)
      return []
    }
  }

  // 連接和斷開
  const connectJamendo = async () => {
    console.log('🎵 連接 Jamendo...')
    
    const configOk = await checkConfig()
    if (!configOk) {
      lastError.value = 'Jamendo 配置不正確'
      return false
    }
    
    try {
      initializePlayer()
      isJamendoConnected.value = true
      lastError.value = ''
      playbackState.value = 'idle'
      
      if (import.meta.env.PROD) {
        console.log('✅ Railway Jamendo 連接成功')
      } else {
        console.log('✅ 開發環境 Jamendo 連接成功')
      }
      
      return true
    } catch (error) {
      console.error('❌ Railway Jamendo 連接失敗:', error)
      lastError.value = '連接失敗: ' + error.message
      playbackState.value = 'error'
      return false
    }
  }

  const disconnectJamendo = () => {
    console.log('🔌 斷開 Jamendo 連接')
    
    try {
      // 安全地停止播放
      if (audioPlayer.value) {
        audioPlayer.value.pause()
        audioPlayer.value.src = ''
      }
      
      // 清理 Promise
      if (currentPlayPromise.value) {
        currentPlayPromise.value = null
      }
      
      isJamendoConnected.value = false
      currentTrack.value = {}
      isPlaying.value = false
      isLoadingTrack.value = false
      playbackState.value = 'idle'
      clearPlaylist()
      lastError.value = ''
    } catch (error) {
      console.error('❌ 斷開連接時出錯:', error)
    }
  }

  // 健康檢查
  const healthCheck = async () => {
    try {
      const response = await jamendoAPI('health/')
      return response.status === 'healthy'
    } catch (error) {
      console.error('❌ 健康檢查失敗:', error)
      return false
    }
  }

  // 獲取可用標籤
  const getAvailableTags = async () => {
    try {
      const response = await jamendoAPI('tags/')
      return response.results || []
    } catch (error) {
      console.error('❌ 獲取標籤失敗:', error)
      return ['pop', 'rock', 'electronic', 'jazz', 'classical', 'hiphop', 'metal', 'world', 'soundtrack', 'lounge']
    }
  }

  // 生命週期
  onMounted(async () => {
    if (!import.meta.env.PROD) {
      console.log('🚀 useJamendo 組件已掛載 (Railway 環境)')
    }
    
    const configOk = await checkConfig()
    if (configOk) {
      await connectJamendo()
    } else if (!import.meta.env.PROD) {
      console.log('💡 提示：Jamendo 需要正確配置才能使用')
    }
  })

  onUnmounted(() => {
    try {
      disconnectJamendo()
    } catch (error) {
      console.error('❌ 組件卸載時出錯:', error)
    }
  })

  return {
    // 狀態
    isJamendoConnected,
    jamendoConfigured,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    currentPlaylist,
    currentTrackIndex,
    autoPlayNext,
    lastError,
    isLoadingTrack,
    playbackState,

    // 方法
    connectJamendo,
    disconnectJamendo,
    playTrack,
    togglePlay,
    previousTrack,
    nextTrack,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    searchTracks,
    getTracksByTag,
    getPopularTracks,
    getLatestTracks,
    getRandomTracks,
    setPlaylist,
    clearPlaylist,
    playNextInPlaylist,
    healthCheck,
    getAvailableTags
  }
}