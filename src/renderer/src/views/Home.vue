<template>
  <div class="home">
    <div class="page-header">
      <h1 class="page-title">记账</h1>
      <button class="btn btn-primary" @click="showAddModal = true">
        + 记一笔
      </button>
    </div>

    <!-- 今日概览 -->
    <div class="today-overview card">
      <h3>今日收支</h3>
      <div class="overview-stats">
        <div class="stat income">
          <span class="label">收入</span>
          <span class="value">+{{ currencySymbol }}{{ todayStats.income.toFixed(2) }}</span>
        </div>
        <div class="stat expense">
          <span class="label">支出</span>
          <span class="value">-{{ currencySymbol }}{{ todayStats.expense.toFixed(2) }}</span>
        </div>
        <div class="stat balance">
          <span class="label">结余</span>
          <span class="value">{{ currencySymbol }}{{ (todayStats.income - todayStats.expense).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filters card">
      <div class="filter-group">
        <select v-model="filterType" class="input">
          <option value="">全部类型</option>
          <option value="income">收入</option>
          <option value="expense">支出</option>
        </select>
        <select v-model="filterCategory" class="input">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <input type="date" v-model="filterDate" class="input" />
      </div>
    </div>

    <!-- 记录列表 -->
    <div class="records-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredRecords.length === 0" class="empty">
        <p>暂无记录</p>
        <button class="btn btn-primary" @click="showAddModal = true">开始记账</button>
      </div>
      <div v-else>
        <div 
          v-for="record in filteredRecords" 
          :key="record.id" 
          class="record-item card"
        >
          <div class="record-main">
            <span 
              class="record-type"
              :class="record.type"
            >
              {{ record.type === 'income' ? '收入' : '支出' }}
            </span>
            <span class="record-category">{{ record.category }}</span>
            <span class="record-remark">{{ record.remark || '-' }}</span>
          </div>
          <div class="record-right">
            <span 
              class="record-amount"
              :class="record.type"
            >
              {{ record.type === 'income' ? '+' : '-' }}{{ currencySymbol }}{{ Number(record.amount).toFixed(2) }}
            </span>
            <span class="record-date">{{ record.date }} {{ record.time.slice(0, 5) }}</span>
          </div>
          <div class="record-actions">
            <button class="btn-icon" @click="editRecord(record)">✏️</button>
            <button class="btn-icon" @click="deleteRecord(record.id)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <AddRecordModal 
      v-if="showAddModal" 
      :edit-record="editingRecord"
      @close="closeModal" 
      @success="onRecordSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import AddRecordModal from '../components/AddRecordModal.vue'

interface Record {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
  time: string
  paymentMethod?: string
  remark?: string
}

const records = ref<Record[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const editingRecord = ref<Record | null>(null)

// 筛选条件
const filterType = ref('')
const filterCategory = ref('')
const filterDate = ref('')

const categories = [
  '餐饮', '交通', '购物', '居住', '教育', 
  '医疗', '娱乐', '转账', '公益', '其他',
  '工资', '奖金', '兼职', '投资收益', '红包'
]

const currencySymbol = ref('¥')

// 今日统计
const todayStats = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  const todayRecords = records.value.filter(r => r.date === today)
  return {
    income: todayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + Number(r.amount), 0),
    expense: todayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount), 0)
  }
})

// 筛选后的记录
const filteredRecords = computed(() => {
  return records.value.filter(r => {
    if (filterType.value && r.type !== filterType.value) return false
    if (filterCategory.value && r.category !== filterCategory.value) return false
    if (filterDate.value && r.date !== filterDate.value) return false
    return true
  })
})

async function loadRecords() {
  loading.value = true
  try {
    records.value = await window.api.getRecords()
  } catch (e) {
    console.error('Failed to load records:', e)
  }
  loading.value = false
}

async function deleteRecord(id: string) {
  if (confirm('确定删除这条记录吗？')) {
    await window.api.deleteRecord(id)
    await loadRecords()
  }
}

function editRecord(record: Record) {
  editingRecord.value = record
  showAddModal.value = true
}

function closeModal() {
  showAddModal.value = false
  editingRecord.value = null
}

function onRecordSuccess() {
  closeModal()
  loadRecords()
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.home {
  max-width: 800px;
}

.today-overview {
  margin-bottom: 20px;
}

.today-overview h3 {
  margin-bottom: 16px;
  color: var(--text);
}

.overview-stats {
  display: flex;
  gap: 20px;
}

.stat {
  flex: 1;
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: var(--bg);
}

.stat .label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat .value {
  font-size: 20px;
  font-weight: 600;
}

.stat.income .value {
  color: var(--income);
}

.stat.expense .value {
  color: var(--expense);
}

.stat.balance .value {
  color: var(--text);
}

.filters {
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.filter-group .input {
  flex: 1;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 10px;
}

.record-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.record-type.income {
  background: #dcfce7;
  color: #16a34a;
}

.record-type.expense {
  background: #fee2e2;
  color: #dc2626;
}

.record-category {
  font-weight: 500;
  color: var(--text);
}

.record-remark {
  color: var(--text-secondary);
  font-size: 13px;
}

.record-right {
  text-align: right;
  margin-right: 12px;
}

.record-amount {
  display: block;
  font-size: 16px;
  font-weight: 600;
}

.record-amount.income {
  color: var(--income);
}

.record-amount.expense {
  color: var(--expense);
}

.record-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.record-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: transparent;
  padding: 4px;
  font-size: 16px;
  opacity: 0.6;
}

.btn-icon:hover {
  opacity: 1;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty p {
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
</style>
