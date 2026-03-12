<template>
  <div class="app-container" :class="{ dark: isDark }">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">💰</span>
        <span class="logo-text">随手记</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="nav-icon">📝</span>
          <span>记账</span>
        </router-link>
        <router-link to="/analysis" class="nav-item" :class="{ active: $route.path === '/analysis' }">
          <span class="nav-icon">📊</span>
          <span>分析</span>
        </router-link>
        <router-link to="/report" class="nav-item" :class="{ active: $route.path === '/report' }">
          <span class="nav-icon">📋</span>
          <span>月报</span>
        </router-link>
        <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
          <span class="nav-icon">⚙️</span>
          <span>设置</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 记账弹窗 -->
    <AddRecordModal 
      v-if="showAddModal" 
      @close="showAddModal = false" 
      @success="onRecordAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { useSettingsStore } from './stores/settings'
import AddRecordModal from './components/AddRecordModal.vue'

const settingsStore = useSettingsStore()
const showAddModal = ref(false)
const isDark = computed(() => settingsStore.settings.theme === 'dark')

// 全局提供刷新数据的方法
const refreshKey = ref(0)
const triggerRefresh = () => {
  refreshKey.value++
}
provide('refreshKey', refreshKey)
provide('triggerRefresh', triggerRefresh)

const onRecordAdded = () => {
  showAddModal.value = false
  triggerRefresh()
}

// 监听快捷键
onMounted(() => {
  settingsStore.loadSettings()
  
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault()
      showAddModal.value = true
    }
  })
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background: #f9fafb;
}

.app-container.dark {
  background: #1f2937;
  color: #f9fafb;
}

.sidebar {
  width: 200px;
  background: #10b981;
  color: white;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 30px;
  font-size: 20px;
  font-weight: bold;
}

.logo-icon {
  font-size: 24px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-icon {
  font-size: 18px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 快捷添加按钮全局样式 */
</style>
