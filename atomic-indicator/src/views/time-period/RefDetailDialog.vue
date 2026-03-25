<template>
  <el-dialog
    :model-value="modelValue"
    title="引用详情"
    width="560px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-table :data="derivedList" style="width: 100%">
      <el-table-column prop="nameCn" label="派生指标中文名" min-width="140">
        <template #default="{ row }">
          <el-link type="primary" @click="goToDerivedDetail(row.id)">{{ row.nameCn }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="nameEn" label="派生指标英文名" min-width="160" />
      <el-table-column prop="ownerName" label="负责人" width="100" />
    </el-table>
    <el-empty v-if="derivedList.length === 0" description="暂无引用" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { derivedIndicatorsByTimePeriod } from '@/mock/data'
import type { TimePeriod } from '@/types'

const props = defineProps<{
  modelValue: boolean
  period: TimePeriod | null
}>()

const router = useRouter()

const derivedList = computed(() => {
  if (!props.period) return []
  return derivedIndicatorsByTimePeriod[props.period.id] || []
})

function goToDerivedDetail(id: string) {
  router.push(`/derived-indicators/detail/${id}`)
}
</script>
