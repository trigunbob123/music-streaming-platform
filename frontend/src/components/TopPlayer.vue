<template>
  <div class="bg-gray-800 p-6 text-white">
    <div class="flex items-center justify-between">
      <!-- 左側：當前播放歌曲 -->
      <CurrentTrackInfo 
        :current-track="currentTrack"
      />

      <!-- 右側：播放控制和音量 -->
      <div class="flex items-center space-x-4 flex-shrink-0">
        <!-- 載入指示器 -->
        <div v-if="isLoadingTrack" class="flex items-center text-orange-400">
          <font-awesome-icon icon="spinner" class="animate-spin mr-2" />
          <span class="text-sm">載入中...</span>
        </div>
        
        <!-- 音頻均衡器視覺效果 -->
        <AudioVisualizer 
          :is-loading-track="isLoadingTrack"
        />
        
        <!-- 播放控制按鈕 -->
        <PlaybackControls 
          :current-track="currentTrack"
          :is-playing="isPlaying"
          :is-loading-track="isLoadingTrack"
          @toggle-play="$emit('toggle-play')"
          @previous-track="$emit('previous-track')"
          @next-track="$emit('next-track')"
        />
        
        <!-- 進度條區域 -->
        <ProgressBar 
          :current-time="currentTime"
          :duration="duration"
          :progress-percentage="progressPercentage"
          @seek="$emit('seek', $event)"
        />

        <!-- 播放模式控制 -->
        <PlaybackModeControls 
          :is-shuffled="isShuffled"
          :repeat-mode="repeatMode"
          @toggle-shuffle="$emit('toggle-shuffle')"
          @toggle-repeat="$emit('toggle-repeat')"
        />

        <!-- 音量控制 -->
        <VolumeControl 
          :volume="volume"
          @volume-change="$emit('volume-change', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import CurrentTrackInfo from './CurrentTrackInfo.vue'
import AudioVisualizer from './AudioVisualizer.vue'
import PlaybackControls from './PlaybackControls.vue'
import ProgressBar from './ProgressBar.vue'
import PlaybackModeControls from './PlaybackModeControls.vue'
import VolumeControl from './VolumeControl.vue'

defineProps({
  currentTrack: {
    type: Object,
    required: true
  },
  isPlaying: {
    type: Boolean,
    required: true
  },
  isLoadingTrack: {
    type: Boolean,
    required: true
  },
  currentTime: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  },
  isShuffled: {
    type: Boolean,
    required: true
  },
  repeatMode: {
    type: String,
    required: true
  },
  progressPercentage: {
    type: Number,
    required: true
  }
})

defineEmits([
  'toggle-play',
  'previous-track',
  'next-track',
  'seek',
  'volume-change',
  'toggle-shuffle',
  'toggle-repeat'
])
</script>