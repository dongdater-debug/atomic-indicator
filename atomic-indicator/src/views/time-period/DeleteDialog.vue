<template>
  <el-dialog
    :model-value="modelValue"
    title="指标删除"
    width="480px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <p>删除前，请确保该时间周期无下游引用。时间周期删除后将无法恢复，是否确认删除？</p>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>

  <RefFailureDialog
    :model-value="failureDialogVisible"
    title="删除失败"
    :failure-list="failureList"
    @update:model-value="(v) => { failureDialogVisible = v; if (!v) onFailureDialogClose() }"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { derivedIndicatorsByTimePeriod } from '@/mock/data'
import type { TimePeriod } from '@/types'
import RefFailureDialog from './RefFailureDialog.vue'

const props = defineProps<{
  modelValue: boolean
  periods: TimePeriod[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success', deletedIds: string[]): void
}>()

const submitting = ref(false)
const failureDialogVisible = ref(false)
const failureList = ref<{ periodNameCn: string; derivedNameCn: string; derivedNameEn: string; ownerName: string }[]>([])
const showingFailure = ref(false)

function handleClose() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!props.periods?.length) return
  submitting.value = true
  const refsList: { periodNameCn: string; derivedNameCn: string; derivedNameEn: string; ownerName: string }[] = []
  const deletedIds: string[] = []

  for (const p of props.periods) {
    const refs = derivedIndicatorsByTimePeriod[p.id] || []
    if (refs.length > 0) {
      refs.forEach((r) => {
        refsList.push({
          periodNameCn: p.nameCn,
          derivedNameCn: r.nameCn,
          derivedNameEn: r.nameEn,
          ownerName: r.ownerName,
        })
      })
    } else {
      deletedIds.push(p.id)
    }
  }

  setTimeout(() => {
    submitting.value = false
    if (refsList.length > 0) {
      failureList.value = refsList
      showingFailure.value = true
      handleClose()
      failureDialogVisible.value = true
    } else {
      emit('success', deletedIds)
      ElMessage.success('删除成功')
      handleClose()
    }
  }, 500)
}

function onFailureDialogClose() {
  failureDialogVisible.value = false
  showingFailure.value = false
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) {
      submitting.value = false
      if (!showingFailure.value) {
        failureDialogVisible.value = false
      }
    } else {
      showingFailure.value = false
    }
  }
)
</script>
