import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchSongs, fetchSpotifyData } from '../services/api'

export const useMusicStore = defineStore('music', () => {
  const songs = ref([])
  const currentPlaylist = ref([])
  const loading = ref(false)
  
  const loadSongs = async () => {
    loading.value = true
    try {
      const response = await fetchSongs()
      songs.value = response.data
    } catch (error) {
      console.error('載入歌曲失敗:', error)
    } finally {
      loading.value = false
    }
  }
  
  const getSongsByGenre = computed(() => {
    return (genre) => songs.value.filter(song => song.genre === genre)
  })
  
  return {
    songs,
    currentPlaylist,
    loading,
    loadSongs,
    getSongsByGenre
  }
}, {
  persist: true
})