export interface Record {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  subcategory?: string
  date: string
  time: string
  paymentMethod?: 'cash' | 'card' | 'wechat' | 'alipay'
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Settings {
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

export interface MonthlyReport {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  balance: number
  incomeChange: number
  expenseChange: number
  topCategories: Array<{
    category: string
    amount: number
    percentage: string
  }>
  largestExpense: Record | null
  reportPath: string
}

export interface ReportFile {
  name: string
  path: string
  created: Date
}

export interface ApiResult<T = any> {
  success: boolean
  error?: string
  data?: T
}

declare global {
  interface Window {
    electron: typeof import('@electron-toolkit/preload').electronAPI
    api: {
      getRecords: () => Promise<Record[]>
      addRecord: (record: Record) => Promise<ApiResult>
      updateRecord: (record: Record) => Promise<ApiResult>
      deleteRecord: (id: string) => Promise<ApiResult>
      getSettings: () => Promise<Settings>
      saveSettings: (settings: Settings) => Promise<ApiResult>
      exportData: (format: 'json' | 'csv') => Promise<ApiResult<{ path: string }>>
      importData: (data: string, format: 'json' | 'csv') => Promise<ApiResult<{ count: number }>>
      generateMonthlyReport: (year: number, month: number) => Promise<ApiResult<MonthlyReport>>
      getReports: () => Promise<ReportFile[]>
      readReport: (path: string) => Promise<ApiResult<{ content: string }>>
    }
  }
}
