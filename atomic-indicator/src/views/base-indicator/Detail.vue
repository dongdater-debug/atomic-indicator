<template>
  <div class="base-indicator-detail">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="指标名称">{{ indicator?.name }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag v-if="indicator" :type="indicator.status === 'online' ? 'success' : 'info'" size="small">
          {{ indicator.status === 'online' ? '已上线' : '已下线' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="负责人">{{ indicator?.owner }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ indicator?.createTime }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { baseIndicatorsByAtomic } from '@/mock/data'
import type { BaseIndicator } from '@/types'

const route = useRoute()
const indicator = ref<BaseIndicator | null>(null)

onMounted(() => {
  const id = route.params.id as string
  for (const refs of Object.values(baseIndicatorsByAtomic)) {
    const found = refs.find((r) => r.id === id)
    if (found) {
      indicator.value = found
      break
    }
  }
})
</script>

<style scoped>
.base-indicator-detail {
  min-height: 200px;
}
</style>
