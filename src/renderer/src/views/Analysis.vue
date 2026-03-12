<template>
  <div class="analysis">
    <div class="page-header">
      <h1 class="page-title">数据分析</h1>
      <div class="date-picker">
        <button class="btn btn-secondary" @click="prevDay">←</button>
        <input type="date" v-model="selectedDate" class="input date-input" />
        <button class="btn btn-secondary" @click="nextDay">→</button>
      </div>
    </div>

    <!-- 今日概览 -->
    <div class="overview-cards">
      <div class="card stat-card income">
        <div class="stat-label">收入</div>
        <div class="stat-value">+{{ currencySymbol }}{{ dayStats.income.toFixed(2) }}</div>
      </div>
      <div class="card stat-card expense">
        <div class="stat-label">支出</div>
        <div class="stat-value">-{{ currencySymbol }}{{ dayStats.expense.toFixed(2) }}</div>
      </div>
      <div class="card stat-card balance">
        <div class="stat-label">结余</div>
        <div class="stat-value">{{ currencySymbol }}{{ (dayStats.income - dayStats.expense).toFixed(2) }}</div>
      </div>
    </div>

    <!-- 分类统计 -->
    <div class="card category-section">
      <h3>支出分类</h3>
      <div v-if="categoryStats.length > 0" class="category-chart">
        <div class="category-list">
          <div 
            v-for="cat in categoryStats" 
            :key="cat.category"
            class="category-item"
          >
            <div class="cat-info">
              <span class="cat-name">{{ cat.category }}</span>
              <span class="cat-amount">{{ currencySymbol }}{{ cat.amount.toFixed(2) }}</span>
            </div>
            <div class="cat-bar">
              <div 
                class="cat-bar-fill" 
                :style="{ width: cat.percentage + '%' }"
              ></div>
            </div>
            <span class="cat-percent">{{ cat.percentage }}%</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-tip">暂无支出记录</div>
    </div>

    <!-- 7天趋势 -->
    <div class="card trend-section">
      <h3>最近7天支出趋势</h3>
      <div class="trend-chart">
        <div 
          v-for="day in weekTrend" 
          :key="day.date"
          class="trend-bar"
        >
          <div 
            class="bar" 
            :style="{ height: day.expense > 0 ? (day.expense / maxExpense * 100) + '%' : '0' }"
          ></div>
          <span class="bar-label">{{ day.dayName }}</span>
          <span class="bar-value">{{ currencySymbol }}{{ day.expense.toFixed(0) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Record {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
}

const records = ref<Record[]>([])
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const currencySymbol = ref('¥')

// 当日统计
const dayStats = computed(() => {
  const dayRecords = records.value.filter(r => r.date === selectedDate.value)
  return {
    income: dayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + Number(r.amount), 0),
    expense: dayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount), 0)
  }
})

// 分类统计
const categoryStats = computed(() => {
  const dayExpenses = records.value.filter(
    r => r.date === selectedDate.value && r.type === 'expense'
  )
  
  const total = dayExpenses.reduce((sum, r) => sum + Number(r.amount), 0)
  
  const stats: Record<string, number> = {}
  dayExpenses.forEach(r => {
    stats[r.category] = (stats[r.category] || 0) + Number(r.amount)
  })
  
  return Object.entries(stats)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
    }))
    .sort((a, b) => b.amount - a.amount)
})

// 7天趋势
const weekTrend = computed(() => {
  const result = []
  const today = new Date()
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)
    
    const dayRecords = records.value.filter(r => r.date === dateStr)
    const expense = dayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount), 0)
    
    result.push({
      date: dateStr,
      dayName: dayNames[date.getDay()],
      expense
    })
  }
  
  return result
})

const maxExpense = computed(() => {
  return Math.max(...weekTrend.value.map(d => d.expense), 100)
})

function prevDay() {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() - 1)
  selectedDate.value = date.toISOString().slice(0, 10)
}

function nextDay() {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + 1)
  selectedDate.value = date.toISOString().slice(0, 10)
}

async function loadRecords() {
  try {
    records.value = await window.api.getRecords()
  } catch (e) {
    console.error('Failed to load records:', e)
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.analysis {
  max-width: 900px;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input {
  width: 150px;
  text-align: center;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 24px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
}

.stat-card.income .stat-value {
  color: var(--income);
}

.stat-card.expense .stat-value {
  color: var(--expense);
}

.category-section,
.trend-section {
  margin-bottom: 20px;
}

.category-section h3,
.trend-section h3 {
  margin-bottom: 16px;
  color: var(--text);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-info {
  width: 100px;
  display: flex;
  flex-direction: column;
}

.cat-name {
  font-weight: 500;
  color: var(--text);
}

.cat-amount {
  font-size: 13px;
  color: var(--text-secondary);
}

.cat-bar {
  flex: 1;
  height: 8px;
  background: var(--bg);
  border-radius: 4px;
  overflow: hidden;
}

.cat-bar-fill {
  height: 100%;
  background: var(--expense);
  border-radius: 4px;
  transition: width 0.3s;
}

.cat-percent {
  width: 50px;
  text-align: right;
  font-size: 13px;
  color: var(--text-secondary);
}

.trend-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200px;
  padding-top: 20px;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar {
  width: 30px;
  background: var(--expense);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

.bar-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.bar-value {
  font-size: 11px;
  color: var(--text);
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
</style>
