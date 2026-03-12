import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Settings {
  currency: string
  currencySymbol: string
  dailyBudget: number
  monthlyBudget: number
  largeExpenseThreshold: number
  enableOverdraftAlert: boolean
  enableLargeExpenseAlert: boolean
  autoBackup: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
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

  async function loadSettings() {
    try {
      const data = await window.api.getSettings()
      if (data) {
        settings.value = { ...settings.value, ...data }
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  async function saveSettings() {
    try {
      await window.api.saveSettings(settings.value)
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  return { settings, loadSettings, saveSettings }
})
