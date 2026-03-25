<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="640px"
    append-to-body
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-table :data="failureList" style="width: 100%">
      <el-table-column prop="periodNameCn" label="时间周期中文名" min-width="140" />
      <el-table-column label="派生指标中文名" min-width="160">
        <template #default="{ row }">
          <el-tooltip content="现阶段展示就可，不可点击" placement="top">
            <span class="link-style">{{ row.derivedNameCn }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="derivedNameEn" label="派生指标英文名" min-width="160" />
      <el-table-column prop="ownerName" label="负责人" width="120" />
    </el-table>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title: string
  failureList: { periodNameCn: string; derivedNameCn: string; derivedNameEn: string; ownerName: string }[]
}>()
</script>

<style scoped>
.link-style {
  color: #409eff;
  cursor: default;
}
</style>
