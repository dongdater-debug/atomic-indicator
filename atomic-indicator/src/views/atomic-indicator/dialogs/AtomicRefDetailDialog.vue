<template>
  <el-dialog
    :model-value="modelValue"
    title="引用详情"
    width="560px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-table :data="derivedList" style="width: 100%">
      <el-table-column prop="nameCn" label="派生指标中文名" min-width="140" />
      <el-table-column prop="nameEn" label="派生指标英文名" min-width="160" />
      <el-table-column prop="ownerName" label="负责人" width="100" />
    </el-table>
    <el-empty v-if="derivedList.length === 0" description="暂无引用" />
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { derivedIndicatorsByAtomic } from '@/mock/data'
import type { AtomicIndicator, DerivedIndicator } from '@/types'

const props = defineProps<{
  modelValue: boolean
  indicator: AtomicIndicator | null
}>()

const derivedList = computed((): DerivedIndicator[] => {
  if (!props.indicator) return []
  return derivedIndicatorsByAtomic[props.indicator.id] || []
})
</script>
