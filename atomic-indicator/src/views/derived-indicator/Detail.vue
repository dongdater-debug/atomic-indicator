<template>
  <div class="derived-indicator-detail">
    <el-descriptions v-if="indicator" :column="1" border>
      <el-descriptions-item label="派生指标中文名">{{ indicator.nameCn }}</el-descriptions-item>
      <el-descriptions-item label="派生指标英文名">{{ indicator.nameEn }}</el-descriptions-item>
      <el-descriptions-item label="负责人">{{ indicator.ownerName }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="indicator.status === 'online' ? 'success' : 'info'" size="small">
          {{ indicator.status === 'online' ? '已上线' : '已下线' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ indicator.createTime }}</el-descriptions-item>
    </el-descriptions>
    <el-empty v-else description="派生指标不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { derivedIndicatorsByTimePeriod } from '@/mock/data'
import type { DerivedIndicator } from '@/types'

const route = useRoute()
const indicator = ref<DerivedIndicator | null>(null)

onMounted(() => {
  const id = route.params.id as string
  for (const refs of Object.values(derivedIndicatorsByTimePeriod)) {
    const found = refs.find((r) => r.id === id)
    if (found) {
      indicator.value = found
      break
    }
  }
})
</script>

<style scoped>
.derived-indicator-detail {
  min-height: 200px;
}
</style>
