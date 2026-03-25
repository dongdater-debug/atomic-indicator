<template>
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    size="520px"
    destroy-on-close
    :close-on-click-modal="isDetailMode"
    :before-close="handleBeforeClose"
  >
    <div class="form-drawer">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="时间中文名">
          <el-input :model-value="generatedNameCn" readonly placeholder="根据模板参数自动生成" />
        </el-form-item>
        <el-form-item label="时间英文名">
          <el-input :model-value="generatedNameEn" readonly placeholder="根据模板参数自动生成" />
        </el-form-item>
        <el-form-item label="时间类型" prop="templateType" required>
          <el-select
            v-model="form.templateType"
            placeholder="请选择时间类型"
            :disabled="!canEditTemplate"
            style="width: 100%"
            @change="onTemplateTypeChange"
          >
            <el-option label="相对时间" value="relative" />
            <el-option label="固定时间" value="fixed" />
          </el-select>
        </el-form-item>

        <!-- 固定时间参数 -->
        <template v-if="form.templateType === 'fixed'">
          <el-form-item label="时间范围" prop="fixedRange" required>
            <el-date-picker
              v-model="form.fixedRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            :disabled="!canEditTemplate"
            style="width: 100%"
          />
          </el-form-item>
        </template>

        <!-- 相对时间参数 -->
        <template v-if="form.templateType === 'relative'">
          <el-form-item label="时间描述" prop="relativeDesc" required>
            <el-select
              v-model="form.relativeDesc"
              placeholder="请选择时间描述"
              :disabled="!canEditTemplate"
              style="width: 100%"
              @change="updateGenerated"
            >
              <el-option label="最近X" value="recent" />
              <el-option label="距今X" value="ago" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间粒度" prop="granularity" required>
            <el-select
              v-model="form.granularity"
              placeholder="请选择"
              :disabled="!canEditTemplate"
              style="width: 100%"
              @change="updateGenerated"
            >
              <el-option label="日" value="day" />
              <el-option label="周" value="week" />
              <el-option label="月" value="month" />
              <el-option label="季" value="quarter" />
              <el-option label="年" value="year" />
            </el-select>
          </el-form-item>
          <el-form-item label="数值（X）" prop="relativeN" required>
            <el-input
              v-model.number="form.relativeN"
              placeholder="请输入正整数（如7、3、1）"
              :disabled="!canEditTemplate"
              @input="updateGenerated"
            />
          </el-form-item>
        </template>

        <el-form-item label="描述" prop="description" required>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入时间周期描述，长度≤200字"
            :disabled="!canEditDescription"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="SQL表达式">
          <el-input
            :model-value="generatedSql"
            type="textarea"
            :rows="4"
            readonly
            placeholder="系统将根据选择的模板和参数，自动生成时间过滤SQL模板"
          />
        </el-form-item>
      </el-form>

      <el-divider />
      <div class="drawer-actions">
        <el-button v-if="isDetailMode" @click="handleDetailClose">取消</el-button>
        <template v-else>
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
        </template>
        <el-button v-if="isDetailMode" type="primary" @click="switchToEdit">编辑</el-button>
      </div>
    </div>

    <el-dialog
      v-model="cancelConfirmVisible"
      :title="props.mode === 'edit' ? '取消编辑' : '取消创建'"
      width="420px"
      append-to-body
    >
      <p>确定取消{{ props.mode === 'edit' ? '编辑' : '创建' }}时间周期吗？已输入的内容将不会保存</p>
      <template #footer>
        <el-button @click="cancelClose">取消</el-button>
        <el-button type="primary" @click="confirmCancel">确定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { derivedIndicatorsByTimePeriod } from '@/mock/data'
import type { TimePeriod, TimeGranularity, RelativeTimeDesc } from '@/types'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit' | 'detail'
  period: TimePeriod | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success', data?: Partial<TimePeriod>): void
  (e: 'switchToEdit'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const cancelConfirmVisible = ref(false)
const pendingCloseDone = ref<(() => void) | null>(null)

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const drawerTitle = computed(() => {
  if (props.mode === 'create') return '新建时间周期'
  if (props.mode === 'edit') return '编辑时间周期'
  return '时间周期详情'
})

const isDetailMode = computed(() => props.mode === 'detail')

const canEditTemplate = computed(() => {
  if (props.mode === 'detail') return false
  if (props.mode === 'create') return true
  if (!props.period) return true
  if (props.period.status === 'offline') return true
  const refs = derivedIndicatorsByTimePeriod[props.period.id] || []
  return refs.length === 0
})

const canEditDescription = computed(() => {
  if (props.mode === 'detail') return false
  return true
})

const form = ref({
  templateType: '' as 'relative' | 'fixed' | '',
  relativeDesc: '' as RelativeTimeDesc | '',
  granularity: '' as TimeGranularity | '',
  relativeN: undefined as number | undefined,
  fixedRange: null as [string, string] | null,
  description: '',
})

const granularityLabelMap: Record<TimeGranularity, string> = {
  day: '天',
  week: '周',
  month: '月',
  quarter: '季度',
  year: '年',
}

const granularityEnMap: Record<TimeGranularity, string> = {
  day: 'days',
  week: 'weeks',
  month: 'months',
  quarter: 'quarters',
  year: 'years',
}

function getGeneratedNameCn(): string {
  if (form.value.templateType === 'fixed' && form.value.fixedRange?.length === 2) {
    return `${form.value.fixedRange[0]}~${form.value.fixedRange[1]}`
  }
  if (
    form.value.templateType === 'relative' &&
    form.value.relativeDesc &&
    form.value.granularity &&
    form.value.relativeN !== undefined &&
    form.value.relativeN > 0
  ) {
    const label = granularityLabelMap[form.value.granularity]
    const n = form.value.relativeN
    if (form.value.relativeDesc === 'recent') {
      return `最近${n}${label}`
    }
    return `距今${n}${label}`
  }
  return ''
}

function getGeneratedNameEn(): string {
  if (form.value.templateType === 'fixed' && form.value.fixedRange?.length === 2) {
    return `${form.value.fixedRange[0]}~${form.value.fixedRange[1]}`
  }
  if (
    form.value.templateType === 'relative' &&
    form.value.relativeDesc &&
    form.value.granularity &&
    form.value.relativeN !== undefined &&
    form.value.relativeN > 0
  ) {
    const en = granularityEnMap[form.value.granularity]
    const n = form.value.relativeN
    if (form.value.relativeDesc === 'recent') {
      return `last_${n}_${en}`
    }
    return `${n}_${en}_ago`
  }
  return ''
}

const sqlUnitMap: Record<TimeGranularity, string> = {
  day: 'DAY',
  week: 'WEEK',
  month: 'MONTH',
  quarter: 'QUARTER',
  year: 'YEAR',
}

function getGeneratedSql(): string {
  if (form.value.templateType === 'fixed' && form.value.fixedRange?.length === 2) {
    return `WHERE 【time】 BETWEEN '${form.value.fixedRange[0]}' AND '${form.value.fixedRange[1]}'`
  }
  if (
    form.value.templateType === 'relative' &&
    form.value.relativeDesc &&
    form.value.granularity &&
    form.value.relativeN !== undefined &&
    form.value.relativeN > 0
  ) {
    const n = form.value.relativeN
    const unit = sqlUnitMap[form.value.granularity]
    if (form.value.relativeDesc === 'recent') {
      return `WHERE 【time】 >= DATE_SUB(CURRENT_DATE(), INTERVAL ${n} ${unit})`
    }
    return `WHERE 【time】 >= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL ${n} ${unit})`
  }
  return ''
}

const generatedNameCn = computed(() => {
  if (props.mode === 'detail' && props.period) return props.period.nameCn
  return getGeneratedNameCn()
})
const generatedNameEn = computed(() => {
  if (props.mode === 'detail' && props.period) return props.period.nameEn
  return getGeneratedNameEn()
})
const generatedSql = computed(() => {
  if (props.mode === 'detail' && props.period?.sqlExpression) return props.period.sqlExpression
  return getGeneratedSql()
})

function updateGenerated() {}

function onTemplateTypeChange() {
  form.value.relativeDesc = ''
  form.value.granularity = ''
  form.value.relativeN = undefined
  form.value.fixedRange = null
}


const rules: FormRules = {
  templateType: [{ required: true, message: '请选择时间类型', trigger: 'change' }],
  relativeDesc: [
    {
      required: true,
      validator: (_: unknown, _v: unknown, cb: (e?: Error) => void) => {
        if (form.value.templateType !== 'relative') return cb()
        if (!form.value.relativeDesc) return cb(new Error('请选择时间描述'))
        cb()
      },
      trigger: 'change',
    },
  ],
  granularity: [
    {
      required: true,
      validator: (_: unknown, _v: unknown, cb: (e?: Error) => void) => {
        if (form.value.templateType !== 'relative') return cb()
        if (!form.value.granularity) return cb(new Error('请选择时间粒度'))
        cb()
      },
      trigger: 'change',
    },
  ],
  relativeN: [
    {
      required: true,
      validator: (_: unknown, v: unknown, cb: (e?: Error) => void) => {
        if (form.value.templateType !== 'relative') return cb()
        if (v === undefined || v === null || v === '') return cb(new Error('请输入正整数'))
        const n = Number(v)
        if (!Number.isInteger(n) || n <= 0) return cb(new Error('请输入正整数'))
        cb()
      },
      trigger: 'blur',
    },
  ],
  fixedRange: [
    {
      required: true,
      validator: (_: unknown, v: unknown, cb: (e?: Error) => void) => {
        if (form.value.templateType !== 'fixed') return cb()
        if (!v || !Array.isArray(v) || v.length !== 2) return cb(new Error('请选择时间范围'))
        cb()
      },
      trigger: 'change',
    },
  ],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
}

function handleBeforeClose(done: () => void) {
  if (props.mode === 'detail') {
    done()
    return
  }
  pendingCloseDone.value = done
  cancelConfirmVisible.value = true
}

function handleDetailClose() {
  emit('update:modelValue', false)
}

function handleCancel() {
  cancelConfirmVisible.value = true
}

function confirmCancel() {
  cancelConfirmVisible.value = false
  if (pendingCloseDone.value) {
    pendingCloseDone.value()
    pendingCloseDone.value = null
  }
  emit('update:modelValue', false)
}

function cancelClose() {
  cancelConfirmVisible.value = false
  pendingCloseDone.value = null
}

function switchToEdit() {
  emit('update:modelValue', false)
  emit('switchToEdit')
}

async function handleSave() {
  const nameCn = getGeneratedNameCn()
  const nameEn = getGeneratedNameEn()
  if (form.value.templateType === 'relative' && (!nameCn || !nameEn)) {
    ElMessage.warning('请完善相对时间参数')
    return
  }
  if (form.value.templateType === 'fixed' && (!nameCn || !nameEn)) {
    ElMessage.warning('请选择时间范围')
    return
  }

  await formRef.value?.validate().catch(() => {})

  submitting.value = true
  const sqlExpr = getGeneratedSql()
  setTimeout(() => {
    ElMessage.success(props.mode === 'create' ? '时间周期创建并上线成功' : '时间周期保存成功')
    submitting.value = false
    setTimeout(() => {
      emit('update:modelValue', false)
      emit('success', {
        nameCn,
        nameEn,
        templateType: form.value.templateType as 'relative' | 'fixed',
        description: form.value.description,
        sqlExpression: sqlExpr,
        status: 'online',
        relativeDesc: form.value.relativeDesc || undefined,
        granularity: form.value.granularity || undefined,
        relativeN: form.value.relativeN,
        fixedStart: form.value.fixedRange?.[0],
        fixedEnd: form.value.fixedRange?.[1],
      })
    }, 1000)
  }, 500)
}

function loadPeriod() {
  if (!props.period) return
  form.value = {
    templateType: props.period.templateType,
    relativeDesc: props.period.relativeDesc || '',
    granularity: props.period.granularity || '',
    relativeN: props.period.relativeN,
    fixedRange: props.period.fixedStart && props.period.fixedEnd
      ? [props.period.fixedStart, props.period.fixedEnd]
      : null,
    description: props.period.description || '',
  }
}

function resetForm() {
  form.value = {
    templateType: '',
    relativeDesc: '',
    granularity: '',
    relativeN: undefined,
    fixedRange: null,
    description: '',
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      if (props.mode === 'create') resetForm()
      else loadPeriod()
    }
  }
)

watch(
  () => props.period,
  () => {
    if (props.modelValue && props.period) loadPeriod()
  }
)
</script>

<style scoped>
.form-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
