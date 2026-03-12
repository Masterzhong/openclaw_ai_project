import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'

let mainWindow: BrowserWindow | null = null

// 数据存储路径
const userDataPath = app.getPath('userData')
const dataDir = join(userDataPath, 'data')
const reportsDir = join(userDataPath, 'reports')
const backupsDir = join(userDataPath, 'backups')

// 确保目录存在
function ensureDirs(): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
}

// 账目记录文件路径
const recordsFile = join(dataDir, 'records.json')
const settingsFile = join(dataDir, 'settings.json')

// 初始化数据文件
function initDataFiles(): void {
  if (!fs.existsSync(recordsFile)) {
    fs.writeFileSync(recordsFile, JSON.stringify([]))
  }
  if (!fs.existsSync(settingsFile)) {
    const defaultSettings = {
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
    }
    fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2))
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC 处理程序
// 获取所有记录
ipcMain.handle('get-records', () => {
  try {
    const data = fs.readFileSync(recordsFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
})

// 添加记录
ipcMain.handle('add-record', (_, record) => {
  try {
    const records = JSON.parse(fs.readFileSync(recordsFile, 'utf-8'))
    records.unshift(record)
    fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// 更新记录
ipcMain.handle('update-record', (_, record) => {
  try {
    const records = JSON.parse(fs.readFileSync(recordsFile, 'utf-8'))
    const index = records.findIndex((r: any) => r.id === record.id)
    if (index !== -1) {
      records[index] = record
      fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2))
      return { success: true }
    }
    return { success: false, error: 'Record not found' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// 删除记录
ipcMain.handle('delete-record', (_, id) => {
  try {
    const records = JSON.parse(fs.readFileSync(recordsFile, 'utf-8'))
    const filtered = records.filter((r: any) => r.id !== id)
    fs.writeFileSync(recordsFile, JSON.stringify(filtered, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// 获取设置
ipcMain.handle('get-settings', () => {
  try {
    const data = fs.readFileSync(settingsFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
})

// 保存设置
ipcMain.handle('save-settings', (_, settings) => {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// 导出数据
ipcMain.handle('export-data', (_, format) => {
  try {
    const records = JSON.parse(fs.readFileSync(recordsFile, 'utf-8'))
    const timestamp = new Date().toISOString().slice(0, 10)
    
    if (format === 'json') {
      const exportPath = join(dataDir, `export_${timestamp}.json`)
      fs.writeFileSync(exportPath, JSON.stringify(records, null, 2))
      return { success: true, path: exportPath }
    } else if (format === 'csv') {
      const headers = ['id', 'type', 'amount', 'category', 'date', 'paymentMethod', 'remark']
      const csvContent = [
        headers.join(','),
        ...records.map((r: any) => headers.map(h => `"${r[h] || ''}"`).join(','))
      ].join('\n')
      const exportPath = join(dataDir, `export_${timestamp}.csv`)
      fs.writeFileSync(exportPath, '\ufeff' + csvContent)
      return { success: true, path: exportPath }
    }
    return { success: false, error: 'Invalid format' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// 导入数据
ipcMain.handle('import-data', (_, data, format) => {
  try {
    let records: any[] = []
    
    if (format === 'json') {
      records = JSON.parse(data)
    } else if (format === 'csv') {
      const lines = data.split('\n').filter(l => l.trim())
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
      records = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
        const obj: any = {}
        headers.forEach((h, i) => {
          obj[h] = values[i]?.replace(/^"|"$/g, '') || ''
        })
        return obj
      })
    }
    
    const existingRecords = JSON.parse(fs.readFileSync(recordsFile, 'utf-8'))
    const merged = [...records, ...existingRecords]
    fs.writeFileSync(recordsFile, JSON.stringify(merged, null, 2))
    return { success: true, count: records.length }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// 生成月度报告
ipcMain.handle('generate-monthly-report', (_, year, month) => {
  try {
    const records = JSON.parse(fs.readFileSync(recordsFile, 'utf-8'))
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = month === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${String(month + 1).padStart(2, '0')}-01`
    
    const monthRecords = records.filter((r: any) => {
      return r.date >= startDate && r.date < endDate
    })
    
    const income = monthRecords
      .filter((r: any) => r.type === 'income')
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0)
    
    const expense = monthRecords
      .filter((r: any) => r.type === 'expense')
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0)
    
    // 分类统计
    const categoryStats: Record<string, number> = {}
    monthRecords
      .filter((r: any) => r.type === 'expense')
      .forEach((r: any) => {
        categoryStats[r.category] = (categoryStats[r.category] || 0) + Number(r.amount)
      })
    
    const topCategories = Object.entries(categoryStats)
      .map(([category, amount]) => ({ category, amount, percentage: (amount / expense * 100).toFixed(1) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    
    // 最大单笔支出
    const largestExpense = monthRecords
      .filter((r: any) => r.type === 'expense')
      .sort((a: any, b: any) => Number(b.amount) - Number(a.amount))[0] || null
    
    // 获取上月数据
    const lastMonth = month === 1 ? 12 : month - 1
    const lastYear = month === 1 ? year - 1 : year
    const lastStartDate = `${lastYear}-${String(lastMonth).padStart(2, '0')}-01`
    const lastEndDate = `${year}-${String(month).padStart(2, '0')}-01`
    
    const lastMonthRecords = records.filter((r: any) => {
      return r.date >= lastStartDate && r.date < lastEndDate
    })
    
    const lastMonthIncome = lastMonthRecords
      .filter((r: any) => r.type === 'income')
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0)
    
    const lastMonthExpense = lastMonthRecords
      .filter((r: any) => r.type === 'expense')
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0)
    
    const incomeChange = lastMonthIncome > 0 
      ? ((income - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) 
      : '0'
    const expenseChange = lastMonthExpense > 0 
      ? ((expense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1) 
      : '0'
    
    // 生成 Markdown 报告
    const reportContent = `# ${year}年${month}月 月度总结

## 收支概况

| 项目 | 金额 |
|------|------|
| 本月收入 | ¥${income.toFixed(2)} |
| 本月支出 | ¥${expense.toFixed(2)} |
| 本月结余 | ¥${(income - expense).toFixed(2)} |

## 环比变化

- 收入变化: ${Number(incomeChange) > 0 ? '+' : ''}${incomeChange}%
- 支出变化: ${Number(expenseChange) > 0 ? '+' : ''}${expenseChange}%

## 支出分类 TOP5

| 排名 | 分类 | 金额 | 占比 |
|------|------|------|------|
${topCategories.map((c, i) => `| ${i + 1} | ${c.category} | ¥${c.amount.toFixed(2)} | ${c.percentage}% |`).join('\n')}

## 最大单笔支出
${largestExpense ? `- 金额: ¥${largestExpense.amount}
- 分类: ${largestExpense.category}
- 日期: ${largestExpense.date}
- 备注: ${largestExpense.remark || '-'}` : '无'}

---

*本报告由随手记自动生成*
`
    
    const reportFile = join(reportsDir, `${year}-${String(month).padStart(2, '0')}-月度总结.md`)
    fs.writeFileSync(reportFile, reportContent)
    
    return { 
      success: true, 
      report: {
        year,
        month,
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        incomeChange: Number(incomeChange),
        expenseChange: Number(expenseChange),
        topCategories,
        largestExpense,
        reportPath: reportFile
      }
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

// 获取报告列表
ipcMain.handle('get-reports', () => {
  try {
    if (!fs.existsSync(reportsDir)) return []
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('-月度总结.md'))
      .map(f => {
        const stats = fs.statSync(join(reportsDir, f))
        return { name: f, path: join(reportsDir, f), created: stats.birthtime }
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime())
    return files
  } catch {
    return []
  }
})

// 读取报告内容
ipcMain.handle('read-report', (_, reportPath) => {
  try {
    const content = fs.readFileSync(reportPath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.accounting.tool')
  
  ensureDirs()
  initDataFiles()
  
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
