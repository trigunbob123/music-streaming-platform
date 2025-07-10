<template>
  <div class="audio-visualizer" v-show="!isLoadingTrack">
    <div class="equalizer-bars">
      <div 
        v-for="i in 16" 
        :key="i" 
        class="equalizer-bar"
        :ref="el => { if (el) equalizerBars[i-1] = el }"
        :data-freq-group="getFrequencyGroup(i-1)"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

defineProps({
  isLoadingTrack: {
    type: Boolean,
    required: true
  }
})

// 音頻均衡器相關
const equalizerBars = ref([])
const audioFrequencyData = ref(Array(16).fill(0.2))

// 獲取頻率組
const getFrequencyGroup = (index) => {
  if (index < 5) return 'bass'      // 低音: 0-4
  if (index < 11) return 'mid'      // 中音: 5-10
  return 'high'                     // 高音: 11-15
}

// 改進的音頻均衡器動態效果
const simulateRealisticAudioSpectrum = () => {
  const currentTimeMs = Date.now()
  const beatPeriod = 600
  const beatPhase = (currentTimeMs % beatPeriod) / beatPeriod
  const beatIntensity = Math.max(0, Math.sin(beatPhase * Math.PI * 2))
  
  audioFrequencyData.value = audioFrequencyData.value.map((currentValue, index) => {
    const freqGroup = getFrequencyGroup(index)
    let newValue = currentValue
    
    if (freqGroup === 'bass') {
      const bassPattern = beatIntensity * (0.8 + Math.sin(currentTimeMs * 0.003 + index) * 0.2)
      const bassRandom = 0.7 + Math.random() * 0.3
      newValue = bassPattern * bassRandom
      
      if (beatPhase < 0.1) {
        newValue = Math.min(1.0, newValue * 1.5)
      }
      
    } else if (freqGroup === 'mid') {
      const midBase = Math.sin(currentTimeMs * 0.005 + index * 0.8) * 0.4 + 0.5
      const midRhythm = Math.sin(beatPhase * Math.PI * 3) * 0.3
      const midRandom = 0.6 + Math.random() * 0.4
      newValue = (midBase + midRhythm) * midRandom
      
    } else {
      const highFreq = Math.sin(currentTimeMs * 0.008 + index * 1.5) * 0.5 + 0.4
      const highSpikes = Math.random() > 0.8 ? Math.random() * 0.6 : 0
      const highRandom = 0.5 + Math.random() * 0.5
      newValue = (highFreq + highSpikes) * highRandom
      
      if (beatPhase > 0.7 && beatPhase < 0.9 && Math.random() > 0.7) {
        newValue = Math.min(1.0, newValue * 2)
      }
    }
    
    const smoothing = freqGroup === 'bass' ? 0.8 : freqGroup === 'mid' ? 0.7 : 0.6
    return currentValue * smoothing + newValue * (1 - smoothing)
  })
  
  updateEqualizerBars()
}

// 更新均衡器條形顯示
const updateEqualizerBars = () => {
  equalizerBars.value.forEach((bar, index) => {
    if (!bar) return
    
    const intensity = audioFrequencyData.value[index]
    const height = Math.max(8, Math.min(90, intensity * 100))
    const freqGroup = getFrequencyGroup(index)
    
    bar.style.height = `${height}%`
    
    if (intensity > 0.8) {
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #ff4500, #ff6347, #ffa500)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #ffa500, #ffff00, #adff2f)'
      } else {
        bar.style.background = 'linear-gradient(to top, #ffff00, #ffffff, #87ceeb)'
      }
      bar.style.boxShadow = `0 0 ${intensity * 10}px rgba(255, 165, 0, ${intensity * 0.8})`
    } else if (intensity > 0.5) {
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #ff6b35, #ff8c42, #ffa449)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #f7931e, #ffab00, #ffc107)'
      } else {
        bar.style.background = 'linear-gradient(to top, #ffcc02, #ffeb3b, #fff200)'
      }
      bar.style.boxShadow = `0 0 ${intensity * 6}px rgba(255, 140, 0, ${intensity * 0.5})`
    } else {
      if (freqGroup === 'bass') {
        bar.style.background = 'linear-gradient(to top, #8b4513, #cd853f)'
      } else if (freqGroup === 'mid') {
        bar.style.background = 'linear-gradient(to top, #daa520, #f0e68c)'
      } else {
        bar.style.background = 'linear-gradient(to top, #f0e68c, #ffffe0)'
      }
      bar.style.boxShadow = 'none'
    }
    
    if (freqGroup === 'bass') {
      bar.style.filter = `saturate(${1 + intensity * 0.5})`
    } else if (freqGroup === 'high') {
      bar.style.filter = `brightness(${1 + intensity * 0.3}) contrast(${1 + intensity * 0.2})`
    } else {
      bar.style.filter = `hue-rotate(${intensity * 20}deg)`
    }
  })
}

// 均衡器動畫控制
let equalizerInterval = null

const startEqualizerAnimation = () => {
  if (equalizerInterval) clearInterval(equalizerInterval)
  equalizerInterval = setInterval(simulateRealisticAudioSpectrum, 80)
}

const stopEqualizerAnimation = () => {
  if (equalizerInterval) {
    clearInterval(equalizerInterval)
    equalizerInterval = null
  }
  
  const fadeOut = () => {
    audioFrequencyData.value = audioFrequencyData.value.map(value => value * 0.9)
    updateEqualizerBars()
    
    if (Math.max(...audioFrequencyData.value) > 0.05) {
      setTimeout(fadeOut, 50)
    } else {
      audioFrequencyData.value.fill(0.1)
      equalizerBars.value.forEach(bar => {
        if (bar) {
          bar.style.height = '8%'
          bar.style.boxShadow = 'none'
          bar.style.filter = 'none'
          bar.style.background = 'linear-gradient(to top, #666, #999)'
        }
      })
    }
  }
  fadeOut()
}

// 對外暴露方法
defineExpose({
  startEqualizerAnimation,
  stopEqualizerAnimation
})

onMounted(() => {
  startEqualizerAnimation()
})

onUnmounted(() => {
  if (equalizerInterval) {
    clearInterval(equalizerInterval)
  }
})
</script>

<style scoped>
/* 改進的音頻均衡器視覺效果 */
.audio-visualizer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  height: 50px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.equalizer-bars {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 100%;
  height: 40px;
  gap: 2px;
}

.equalizer-bar {
  width: 10px;
  min-height: 4px;
  height: 8%;
  background: linear-gradient(to top, #666, #999);
  border-radius: 3px;
  transition: height 0.08s ease-out, background 0.1s ease, box-shadow 0.1s ease, filter 0.1s ease;
  position: relative;
}

/* 低音條（0-4）*/
.equalizer-bar[data-freq-group="bass"] {
  background: linear-gradient(to top, #ff6b35 0%, #ff8c42 50%, #ffa449 100%);
}

/* 中音條（5-10）*/
.equalizer-bar[data-freq-group="mid"] {
  background: linear-gradient(to top, #f7931e 0%, #ffab00 50%, #ffc107 100%);
}

/* 高音條（11-15）*/
.equalizer-bar[data-freq-group="high"] {
  background: linear-gradient(to top, #ffcc02 0%, #ffeb3b 50%, #fff200 100%);
}

/* 改進音頻均衡器樣式 */
.audio-visualizer {
  transition: opacity 0.3s ease;
}
</style>