<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="560px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-table :data="failureList" style="width: 100%">
      <el-table-column prop="atomicNameCn" label="原子指标中文名" min-width="120" />
      <el-table-column prop="baseNameCn" label="引用基础指标中文名" min-width="140" />
      <el-table-column prop="baseNameEn" label="引用基础指标英文名" min-width="140" />
      <el-table-column prop="owner" label="负责人" width="100" />
      <el-table-column label="解除引用" width="100">
        <template #default="{ row }">
          <el-link type="primary" @click="goToBaseDetail(row.baseId)">解除引用</el-link>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  modelValue: boolean
  title: string
  failureList: { atomicNameCn: string; baseNameCn: string; baseNameEn: string; owner: string; baseId: string }[]
}>()

const router = useRouter()

function goToBaseDetail(id: string) {
  router.push(`/base-indicators/detail/${id}`)
}
</script>
