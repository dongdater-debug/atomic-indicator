<template>
  <el-dialog
    :model-value="modelValue"
    title="指标下线"
    width="480px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <p>下线前，请确保无基础指标引用。指标下线后，将无法被基础指标引用，是否下线？</p>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">
        确定
      </el-button>
    </template>
  </el-dialog>

  <RefFailureDialog
    v-model="failureDialogVisible"
    title="下线失败"
    :failure-list="failureList"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { baseIndicatorsByAtomic } from '@/mock/data'
import type { AtomicIndicator } from '@/types'
import RefFailureDialog from './RefFailureDialog.vue'

const props = defineProps<{
  modelValue: boolean
  indicators: AtomicIndicator[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success', offlinedIndicators: AtomicIndicator[]): void
}>()

const submitting = ref(false)
const failureDialogVisible = ref(false)
const failureList = ref<{ atomicNameCn: string; baseNameCn: string; baseNameEn: string; owner: string; baseId: string }[]>([])

function handleClose() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!props.indicators?.length) return
  submitting.value = true
  const refsList: { atomicNameCn: string; baseNameCn: string; baseNameEn: string; owner: string; baseId: string }[] = []
  const toOffline: AtomicIndicator[] = []

  for (const ind of props.indicators) {
    const refs = baseIndicatorsByAtomic[ind.id] || []
    if (refs.length > 0) {
      refs.forEach((r) => {
        refsList.push({
          atomicNameCn: ind.nameCn,
          baseNameCn: r.name,
          baseNameEn: r.nameEn || '',
          owner: r.owner,
          baseId: r.id,
        })
      })
    } else {
      toOffline.push(ind)
    }
  }

  setTimeout(() => {
    submitting.value = false
    if (toOffline.length > 0) {
      emit('success', toOffline)
    }
    if (refsList.length > 0) {
      failureList.value = refsList
      handleClose()
      failureDialogVisible.value = true
    } else {
      ElMessage.success('操作成功')
      handleClose()
    }
  }, 500)
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) {
      submitting.value = false
      failureDialogVisible.value = false
    }
  }
)
</script>
