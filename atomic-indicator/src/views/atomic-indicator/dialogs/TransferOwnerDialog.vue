<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="480px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="原负责人">
        <el-input :model-value="originalOwnerText" disabled />
      </el-form-item>
      <el-form-item label="新负责人" prop="newOwner">
        <el-select
          v-model="form.newOwner"
          placeholder="请选择"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="u in users"
            :key="u.id"
            :label="`${u.name} (${u.enName})`"
            :value="u.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { users } from '@/mock/data'
import type { AtomicIndicator } from '@/types'

const props = defineProps<{
  modelValue: boolean
  type: 'biz' | 'tech'
  indicators: AtomicIndicator[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = ref({ newOwner: '' })

const dialogTitle = computed(() => {
  const suffix = props.type === 'biz' ? '业务负责人' : '技术负责人'
  return props.indicators.length > 1 ? `批量转移${suffix}` : `转移${suffix}`
})

const originalOwnerText = computed(() => {
  if (props.indicators.length === 0) return ''
  const owners = new Set(
    props.indicators.map((i) =>
      props.type === 'biz' ? i.bizOwnerName : i.techOwnerName
    )
  )
  return owners.size > 1 ? '多负责人' : [...owners][0] || ''
})

const rules: FormRules = {
  newOwner: [{ required: true, message: '请选择新负责人', trigger: 'change' }],
}

function handleClose() {
  form.value = { newOwner: '' }
  formRef.value?.resetFields()
  emit('update:modelValue', false)
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  setTimeout(() => {
    ElMessage.success('操作成功')
    submitting.value = false
    handleClose()
    emit('success')
  }, 500)
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) form.value = { newOwner: '' }
  }
)
</script>
