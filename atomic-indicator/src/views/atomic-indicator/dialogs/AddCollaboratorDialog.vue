<template>
  <el-dialog
    :model-value="modelValue"
    title="添加协作人"
    width="480px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <el-select
      v-model="selectedUsers"
      multiple
      filterable
      placeholder="请输入英文名搜索"
      style="width: 100%"
      value-key="id"
    >
      <el-option
        v-for="u in filteredUsers"
        :key="u.id"
        :label="`${u.name} (${u.enName})`"
        :value="u"
      />
    </el-select>
    <div v-if="selectedUsers.length" class="selected-tags">
      <el-tag
        v-for="u in selectedUsers"
        :key="u.id"
        closable
        @close="removeUser(u)"
      >
        {{ u.name }}
      </el-tag>
    </div>
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
import type { User } from '@/types'
import type { AtomicIndicator } from '@/types'

const props = defineProps<{
  modelValue: boolean
  indicators: AtomicIndicator[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const submitting = ref(false)
const selectedUsers = ref<User[]>([])
const searchKeyword = ref('')

const filteredUsers = computed(() => users)

function removeUser(u: User) {
  selectedUsers.value = selectedUsers.value.filter((x) => x.id !== u.id)
}

function handleClose() {
  selectedUsers.value = []
  emit('update:modelValue', false)
}

function handleSubmit() {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请至少选择一位协作人')
    return
  }
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
    if (!v) selectedUsers.value = []
  }
)
</script>

<style scoped>
.selected-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
