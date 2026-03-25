<template>
  <el-dialog
    :model-value="modelValue"
    title="管理协作人"
    width="560px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div class="search-row">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入英文名搜索"
        style="width: 280px"
      />
      <el-button type="primary" @click="addUser">添加</el-button>
    </div>
    <el-table :data="collaboratorList" style="margin-top: 16px">
      <el-table-column prop="name" label="用户" />
      <el-table-column prop="role" label="权限" width="120">
        <template #default>协作者</template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button link type="danger" @click="removeUser(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="collaboratorList.length === 0" description="暂无协作人" />
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
import { ElMessage } from 'element-plus'
import { users } from '@/mock/data'
import type { AtomicIndicator } from '@/types'

const props = defineProps<{
  modelValue: boolean
  indicator: AtomicIndicator | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const submitting = ref(false)
const searchKeyword = ref('')
const localCollaborators = ref<string[]>([])

const collaboratorList = computed(() => {
  return localCollaborators.value
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean)
    .map((u) => ({ id: u!.id, name: u!.name }))
})

function addUser() {
  const u = users.find(
    (x) =>
      x.enName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      x.name.includes(searchKeyword.value)
  )
  if (u && !localCollaborators.value.includes(u.id)) {
    localCollaborators.value = [...localCollaborators.value, u.id]
  }
  searchKeyword.value = ''
}

function removeUser(row: { id: string }) {
  localCollaborators.value = localCollaborators.value.filter((x) => x !== row.id)
}

function handleClose() {
  emit('update:modelValue', false)
}

function handleSubmit() {
  submitting.value = true
  setTimeout(() => {
    ElMessage.success('操作成功')
    submitting.value = false
    handleClose()
    emit('success')
  }, 500)
}

watch(
  () => props.indicator,
  (ind) => {
    localCollaborators.value = ind ? [...(ind.collaborators || [])] : []
  },
  { immediate: true }
)
</script>

<style scoped>
.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
