<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">设置</h1>
    </div>

    <!-- 预算设置 -->
    <div class="card settings-section">
      <h3>预算设置</h3>
      <div class="setting-item">
        <label>日预算</label>
        <div class="input-group">
          <span class="prefix">{{ settings.currencySymbol }}</span>
          <input 
            type="number" 
            v-model.number="settings.dailyBudget" 
            class="input"
            @change="saveSettings"
          />
        </div>
      </div>
      <div class="setting-item">
        <label>月预算</label>
        <div class="input-group">
          <span class="prefix">{{ settings.currencySymbol }}</span>
          <input 
            type="number" 
            v-model.number="settings.monthlyBudget" 
            class="input"
            @change="saveSettings"
          />
        </div>
      </div>
      <div class="setting-item">
        <label>大额支出提醒阈值</label>
        <div class="input-group">
          <span class="prefix">{{ settings.currencySymbol }}</span>
          <input 
            type="number" 
            v-model.number="settings.largeExpenseThreshold" 
            class="input"
            @change="saveSettings"
          />
        </div>
      </div>
    </div>

    <!-- 提醒设置 -->
    <div class="card settings-section">
      <h3>提醒设置</h3>
      <div class="setting-item toggle">
        <label>超支提醒</label>
        <input 
          type="checkbox" 
          v-model="settings.enableOverdraftAlert"
          @change="saveSettings"
        />
      </div>
      <div class="setting-item toggle">
        <label>大额支出提醒</label>
        <input 
          type="checkbox" 
          v-model="settings.enableLargeExpenseAlert"
          @change="saveSettings"
        />
      </div>
    </div>

    <!-- 外观 -->
    <div class="card settings-section">
      <h3>外观</h3>
      <div class="setting-item">
        <label>主题</label>
        <select v-model="settings.theme" class="input" @change="saveSettings">
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card settings-section">
      <h3>数据管理</h3>
      <div class="setting-item toggle">
        <label>自动备份</label>
        <input 
          type="checkbox" 
          v-model="settings.autoBackup"
          @change="saveSettings"
        />
      </div>
      <div class="data-actions">
        <button class="btn btn-secondary" @click="exportData('json')">
          导出 JSON
        </button>
        <button class="btn btn-secondary" @click="exportData('csv')">
          导出 CSV
        </button>
        <label class="btn btn-secondary import-btn">
          导入数据
          <input 
            type="file" 
            accept=".json,.csv" 
            @change="importData"
            style="display: none;"
          />
        </label>
      </div>
    </div>

    <!-- 关于 -->
    <div class="card settings-section">
      <h3>关于</h3>
      <div class="about-info">
        <p><strong>随手记</strong> - 轻量级个人记账工具</p>
        <p>版本: 1.0.0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()

const settings = ref({
  currency: 'CNY',
  currencySymbol: '¥',
  dailyBudget: 100,
  monthlyBudget: 3000,
  largeExpenseThreshold: 500,
  enableOverdraftAlert: true,
  enableLargeExpenseAlert: true,
  autoBackup: true,
  theme: 'light',
  language: 'zh-CN'
})

async function saveSettings() {
  try {
    await window.api.saveSettings(settings.value)
    settingsStore.settings = settings.value
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

async function exportData(format: 'json' | 'csv') {
  try {
    const result = await window.api.exportData(format)
    if (result.success) {
      alert(`导出成功！文件保存在: ${result.path}`)
    }
  } catch (e) {
    console.error('Failed to export data:', e)
  }
}

async function importData(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const format = file.name.endsWith('.csv') ? 'csv' : 'json'
  const reader = new FileReader()
  
  reader.onload = async (e) => {
    const content = e.target?.result as string
    try {
      const result = await window.api.importData(content, format)
      if (result.success) {
        alert(`导入成功！共导入 ${result.count} 条记录`)
      } else {
        alert(`导入失败: ${result.error}`)
      }
    } catch (err) {
      console.error('Failed to import data:', err)
      alert('导入失败')
    }
  }
  
  reader.readAsText(file)
  input.value = ''
}

onMounted(async () => {
  await settingsStore.loadSettings()
  settings.value = { ...settingsStore.settings }
})
</script>

<style scoped>
.settings-page {
  max-width: 600px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section h3 {
  margin-bottom: 16px;
  color: var(--text);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item label {
  font-weight: 500;
  color: var(--text);
}

.setting-item.toggle {
  cursor: pointer;
}

.setting-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-group .prefix {
  color: var(--text-secondary);
}

.input-group .input {
  width: 120px;
}

.setting-item .input {
  width: 150px;
}

.data-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.import-btn {
  display: inline-block;
  cursor: pointer;
}

.about-info {
  color: var(--text);
}

.about-info p {
  margin-bottom: 8px;
}
</style>
