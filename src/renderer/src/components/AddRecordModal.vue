<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editRecord ? '编辑记录' : '记一笔' }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <!-- 类型选择 -->
        <div class="type-switch">
          <button 
            :class="{ active: form.type === 'expense' }"
            @click="form.type = 'expense'"
          >
            支出
          </button>
          <button 
            :class="{ active: form.type === 'income' }"
            @click="form.type = 'income'"
          >
            收入
          </button>
        </div>

        <!-- 金额输入 -->
        <div class="form-group">
          <label>金额</label>
          <div class="amount-input-wrapper">
            <input 
              ref="amountInputRef"
              type="text" 
              v-model="amountDisplay"
              @keydown="handleAmountKeydown"
              @input="handleAmountInput"
              @focus="handleAmountFocus"
              class="input amount-input"
              placeholder="0.00"
              inputmode="decimal"
            />
          </div>
          <!-- 快捷金额按钮 -->
          <div class="quick-amount-buttons">
            <template v-if="form.type === 'expense'">
              <button 
                v-for="amt in expenseQuickAmounts" 
                :key="amt"
                @click="setQuickAmount(amt)"
                class="quick-btn"
              >
                {{ formatQuickAmount(amt) }}
              </button>
            </template>
            <template v-else>
              <button 
                v-for="amt in incomeQuickAmounts" 
                :key="amt"
                @click="setQuickAmount(amt)"
                class="quick-btn"
              >
                {{ formatQuickAmount(amt) }}
              </button>
            </template>
          </div>
        </div>

        <!-- 分类选择 -->
        <div class="form-group">
          <label>分类</label>
          <select v-model="form.category" class="input">
            <option value="">请选择分类</option>
            <option 
              v-for="cat in currentCategories" 
              :key="cat" 
              :value="cat"
            >
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- 日期 -->
        <div class="form-group">
          <label>日期</label>
          <input type="date" v-model="form.date" class="input" />
        </div>

        <!-- 支付方式（仅支出） -->
        <div class="form-group" v-if="form.type === 'expense'">
          <label>支付方式</label>
          <select v-model="form.paymentMethod" class="input">
            <option value="">请选择</option>
            <option value="cash">现金</option>
            <option value="card">银行卡</option>
            <option value="wechat">微信</option>
            <option value="alipay">支付宝</option>
          </select>
        </div>

        <!-- 备注 -->
        <div class="form-group">
          <label>备注</label>
          <input 
            type="text" 
            v-model="form.remark" 
            class="input"
            placeholder="添加备注（可选）"
          />
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="submit" :disabled="!isValid">
          {{ editRecord ? '保存' : '确认' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { v4 as uuidv4 } from 'uuid'

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

const props = defineProps<{
  editRecord?: Record | null
}>()

const emit = defineEmits(['close', 'success'])

const expenseCategories = [
  '餐饮', '交通', '购物', '居住', '教育', 
  '医疗', '娱乐', '转账', '公益', '其他'
]

const incomeCategories = [
  '工资', '奖金', '兼职', '投资收益', '红包', '其他'
]

// 快捷金额
const expenseQuickAmounts = [10, 20, 50, 100, 200, 500]
const incomeQuickAmounts = [100, 500, 1000, 2000, 5000, 10000]

// 金额输入相关
const amountInputRef = ref<HTMLInputElement | null>(null)
const amountDisplay = ref('')

const currentCategories = computed(() => {
  return props.editRecord?.type === 'income' ? incomeCategories : 
         props.editRecord?.type === 'expense' ? expenseCategories :
         form.value.type === 'income' ? incomeCategories : expenseCategories
})

const form = ref({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  category: '',
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 8),
  paymentMethod: '',
  remark: ''
})

// 解析输入为数字
function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  return Math.min(Math.max(num, 0), 999999.99)
}

// 格式化千位分隔符
function formatWithThousands(num: number): string {
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// 处理键盘事件
function handleAmountKeydown(e: KeyboardEvent) {
  const key = e.key
  
  // Enter 键提交表单
  if (key === 'Enter') {
    e.preventDefault()
    if (isValid.value) {
      submit()
    }
    return
  }
  
  // 允许的键
  const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab']
  const isCtrlOrMeta = e.ctrlKey || e.metaKey
  
  // Ctrl+A 全选
  if (isCtrlOrMeta && key === 'a') {
    e.preventDefault()
    amountInputRef.value?.select()
    return
  }
  
  // Ctrl+V 粘贴 - 允许默认行为，由 handleAmountPaste 处理
  if (isCtrlOrMeta && key === 'v') {
    return
  }
  
  // Ctrl+C 复制
  if (isCtrlOrMeta && key === 'c') {
    return
  }
  
  // 阻止其他非数字键
  if (!allowedKeys.includes(key) && !isCtrlOrMeta) {
    e.preventDefault()
    return
  }
  
  // 小数点处理
  if (key === '.') {
    const currentValue = amountInputRef.value?.value || ''
    if (currentValue.includes('.')) {
      e.preventDefault()
      return
    }
  }
  
  // 数字键限制（最多2位小数）
  if (/^\d$/.test(key)) {
    const currentValue = amountInputRef.value?.value || ''
    const selectionStart = amountInputRef.value?.selectionStart || currentValue.length
    
    // 检查是否在编辑小数部分
    const dotIndex = currentValue.indexOf('.')
    if (dotIndex !== -1 && selectionStart > dotIndex) {
      const decimalPart = currentValue.substring(dotIndex + 1)
      if (decimalPart.length >= 2) {
        e.preventDefault()
        return
      }
    }
  }
}

// 处理输入事件
function handleAmountInput(e: Event) {
  const input = e.target as HTMLInputElement
  let value = input.value
  
  // 移除非数字和小数点
  let cleaned = value.replace(/[^\d.]/g, '')
  
  // 处理多个小数点 - 只保留第一个
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  
  // 限制小数位数
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + '.' + parts[1].substring(0, 2)
  }
  
  // 解析并限制范围（支持以小数点开头的情况，如 .5）
  let num = parseFloat(cleaned)
  if (isNaN(num)) {
    // 如果是空或只有小数点，允许继续输入
    if (cleaned === '' || cleaned === '.') {
      amountDisplay.value = cleaned
      form.value.amount = 0
      return
    }
    num = 0
  }
  
  if (num > 999999.99) {
    form.value.amount = 999999.99
    amountDisplay.value = '999999.99'
  } else {
    form.value.amount = num
    // 如果是空或以小数点开头，不格式化
    if (cleaned === '' || cleaned === '.') {
      amountDisplay.value = cleaned
    } else {
      // 添加千位分隔符格式化
      amountDisplay.value = formatWithThousands(num)
    }
  }
}

// 聚焦时全选
function handleAmountFocus() {
  amountInputRef.value?.select()
}

// 设置快捷金额
function setQuickAmount(amount: number) {
  form.value.amount = amount
  amountDisplay.value = formatWithThousands(amount)
  amountInputRef.value?.focus()
}

// 格式化快捷金额显示
function formatQuickAmount(amount: number): string {
  if (amount >= 1000) {
    return (amount / 1000) + 'k'
  }
  return amount.toString()
}

const isValid = computed(() => {
  return form.value.amount >= 0.01 && form.value.category
})

// 初始化编辑数据
watch(() => props.editRecord, (record) => {
  if (record) {
    form.value = {
      type: record.type,
      amount: record.amount,
      category: record.category,
      date: record.date,
      time: record.time,
      paymentMethod: record.paymentMethod || '',
      remark: record.remark || ''
    }
    amountDisplay.value = record.amount > 0 ? record.amount.toString() : ''
  }
}, { immediate: true })

// 切换类型时清空金额
watch(() => form.value.type, () => {
  if (!props.editRecord) {
    form.value.amount = 0
    amountDisplay.value = ''
  }
})

// 自动聚焦金额输入框
onMounted(async () => {
  await nextTick()
  if (!props.editRecord) {
    amountInputRef.value?.focus()
  }
})

async function submit() {
  if (!isValid.value) return

  const now = new Date()
  const record: Record = {
    id: props.editRecord?.id || uuidv4(),
    type: form.value.type,
    amount: form.value.amount,
    category: form.value.category,
    date: form.value.date,
    time: form.value.time,
    paymentMethod: form.value.paymentMethod || undefined,
    remark: form.value.remark || undefined,
    createdAt: props.editRecord?.createdAt || now.toISOString(),
    updatedAt: now.toISOString()
  }

  try {
    if (props.editRecord) {
      await window.api.updateRecord(record)
    } else {
      await window.api.addRecord(record)
    }
    emit('success')
  } catch (e) {
    console.error('Failed to save record:', e)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-card);
  border-radius: 16px;
  width: 400px;
  max-width: 90vw;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 18px;
  color: var(--text);
}

.close-btn {
  background: transparent;
  font-size: 24px;
  color: var(--text-secondary);
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

.type-switch {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.type-switch button {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.2s;
}

.type-switch button.active {
  background: var(--primary);
  color: white;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.amount-input {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--border);
}

.modal-footer .btn {
  flex: 1;
}
</style>
