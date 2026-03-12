<template>
  <div class="report-page">
    <div class="page-header">
      <h1 class="page-title">月度总结</h1>
      <button class="btn btn-primary" @click="generateReport" :disabled="generating">
        {{ generating ? '生成中...' : '生成本月报告' }}
      </button>
    </div>

    <!-- 月份选择 -->
    <div class="month-selector">
      <button class="btn btn-secondary" @click="prevMonth">←</button>
      <span class="current-month">{{ currentYear }}年{{ currentMonth }}月</span>
      <button class="btn btn-secondary" @click="nextMonth">→</button>
    </div>

    <!-- 报告内容 -->
    <div v-if="report" class="report-content">
      <!-- 收支概况 -->
      <div class="card overview-section">
        <h3>收支概况</h3>
        <div class="overview-grid">
          <div class="overview-item">
            <span class="label">本月收入</span>
            <span class="value income">+{{ currencySymbol }}{{ report.totalIncome.toFixed(2) }}</span>
          </div>
          <div class="overview-item">
            <span class="label">本月支出</span>
            <span class="value expense">-{{ currencySymbol }}{{ report.totalExpense.toFixed(2) }}</span>
          </div>
          <div class="overview-item">
            <span class="label">本月结余</span>
            <span class="value">{{ currencySymbol }}{{ report.balance.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- 环比变化 -->
      <div class="card change-section">
        <h3>环比变化</h3>
        <div class="change-grid">
          <div class="change-item">
            <span class="label">收入变化</span>
            <span 
              class="value"
              :class="report.incomeChange >= 0 ? 'up' : 'down'"
            >
              {{ report.incomeChange >= 0 ? '↑' : '↓' }}{{ Math.abs(report.incomeChange) }}%
            </span>
          </div>
          <div class="change-item">
            <span class="label">支出变化</span>
            <span 
              class="value"
              :class="report.expenseChange >= 0 ? 'up' : 'down'"
            >
              {{ report.expenseChange >= 0 ? '↑' : '↓' }}{{ Math.abs(report.expenseChange) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- TOP5 分类 -->
      <div class="card top5-section">
        <h3>支出分类 TOP5</h3>
        <div class="top5-list">
          <div 
            v-for="(cat, index) in report.topCategories" 
            :key="cat.category"
            class="top5-item"
          >
            <span class="rank">{{ index + 1 }}</span>
            <span class="category">{{ cat.category }}</span>
            <span class="amount">{{ currencySymbol }}{{ cat.amount.toFixed(2) }}</span>
            <span class="percent">{{ cat.percentage }}%</span>
          </div>
        </div>
      </div>

      <!-- 最大单笔支出 -->
      <div class="card largest-section">
        <h3>最大单笔支出</h3>
        <div v-if="report.largestExpense" class="largest-info">
          <div class="largest-row">
            <span class="label">金额</span>
            <span class="value expense">{{ currencySymbol }}{{ report.largestExpense.amount }}</span>
          </div>
          <div class="largest-row">
            <span class="label">分类</span>
            <span class="value">{{ report.largestExpense.category }}</span>
          </div>
          <div class="largest-row">
            <span class="label">日期</span>
            <span class="value">{{ report.largestExpense.date }}</span>
          </div>
          <div class="largest-row">
            <span class="label">备注</span>
            <span class="value">{{ report.largestExpense.remark || '-' }}</span>
          </div>
        </div>
        <div v-else class="empty-tip">暂无支出记录</div>
      </div>
    </div>

    <!-- 历史报告列表 -->
    <div class="card history-section">
      <h3>历史报告</h3>
      <div v-if="reportList.length > 0" class="history-list">
        <div 
          v-for="report in reportList" 
          :key="report.path"
          class="history-item"
        >
          <span class="report-name">{{ report.name }}</span>
          <button class="btn btn-secondary" @click="viewReport(report.path)">查看</button>
        </div>
      </div>
      <div v-else class="empty-tip">暂无历史报告</div>
    </div>

    <!-- Markdown 预览弹窗 -->
    <div v-if="showMarkdown" class="modal-overlay" @click.self="showMarkdown = false">
      <div class="modal markdown-modal">
        <div class="modal-header">
          <h2>报告详情</h2>
          <button class="close-btn" @click="showMarkdown = false">×</button>
        </div>
        <div class="modal-body">
          <pre class="markdown-content">{{ markdownContent }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface MonthlyReport {
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
  largestExpense: any
}

interface ReportFile {
  name: string
  path: string
}

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const report = ref<MonthlyReport | null>(null)
const reportList = ref<ReportFile[]>([])
const generating = ref(false)
const currencySymbol = ref('¥')

// Markdown 预览
const showMarkdown = ref(false)
const markdownContent = ref('')

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadMonthReport()
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadMonthReport()
}

async function generateReport() {
  generating.value = true
  try {
    const result = await window.api.generateMonthlyReport(currentYear.value, currentMonth.value)
    if (result.success && result.report) {
      report.value = result.report
    }
    await loadReportList()
  } catch (e) {
    console.error('Failed to generate report:', e)
  }
  generating.value = false
}

async function loadMonthReport() {
  // 尝试加载已生成的报告
  const result = await window.api.generateMonthlyReport(currentYear.value, currentMonth.value)
  if (result.success && result.report) {
    report.value = result.report
  } else {
    report.value = null
  }
}

async function loadReportList() {
  try {
    reportList.value = await window.api.getReports()
  } catch (e) {
    console.error('Failed to load reports:', e)
  }
}

async function viewReport(path: string) {
  const result = await window.api.readReport(path)
  if (result.success && result.content) {
    markdownContent.value = result.content
    showMarkdown.value = true
  }
}

onMounted(() => {
  loadMonthReport()
  loadReportList()
})
</script>

<style scoped>
.report-page {
  max-width: 800px;
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
}

.current-month {
  font-size: 18px;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.overview-section h3,
.change-section h3,
.top5-section h3,
.largest-section h3,
.history-section h3 {
  margin-bottom: 16px;
  color: var(--text);
}

.overview-grid,
.change-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.overview-item,
.change-item {
  text-align: center;
  padding: 16px;
  background: var(--bg);
  border-radius: 8px;
}

.overview-item .label,
.change-item .label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.overview-item .value,
.change-item .value {
  font-size: 20px;
  font-weight: 600;
}

.overview-item .value.income {
  color: var(--income);
}

.overview-item .value.expense {
  color: var(--expense);
}

.change-item .value.up {
  color: var(--income);
}

.change-item .value.down {
  color: var(--expense);
}

.top5-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.top5-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
}

.top5-item .rank {
  width: 24px;
  height: 24px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.top5-item .category {
  flex: 1;
  font-weight: 500;
}

.top5-item .amount {
  font-weight: 600;
}

.top5-item .percent {
  color: var(--text-secondary);
  font-size: 13px;
}

.largest-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.largest-row {
  display: flex;
  padding: 10px;
  background: var(--bg);
  border-radius: 8px;
}

.largest-row .label {
  width: 60px;
  color: var(--text-secondary);
}

.largest-row .value {
  flex: 1;
}

.largest-row .value.expense {
  color: var(--expense);
  font-weight: 600;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
}

.report-name {
  font-size: 14px;
}

.empty-tip {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
}

.markdown-modal {
  width: 700px;
  max-height: 80vh;
}

.markdown-content {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
  max-height: 60vh;
  overflow-y: auto;
}
</style>
