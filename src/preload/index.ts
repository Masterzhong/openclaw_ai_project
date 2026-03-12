import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 账目记录
  getRecords: () => ipcRenderer.invoke('get-records'),
  addRecord: (record: any) => ipcRenderer.invoke('add-record', record),
  updateRecord: (record: any) => ipcRenderer.invoke('update-record', record),
  deleteRecord: (id: string) => ipcRenderer.invoke('delete-record', id),
  
  // 设置
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  
  // 数据导入导出
  exportData: (format: 'json' | 'csv') => ipcRenderer.invoke('export-data', format),
  importData: (data: string, format: 'json' | 'csv') => ipcRenderer.invoke('import-data', data, format),
  
  // 月度报告
  generateMonthlyReport: (year: number, month: number) => ipcRenderer.invoke('generate-monthly-report', year, month),
  getReports: () => ipcRenderer.invoke('get-reports'),
  readReport: (path: string) => ipcRenderer.invoke('read-report', path)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
