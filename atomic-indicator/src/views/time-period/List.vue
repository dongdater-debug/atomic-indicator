<template>
  <div class="time-period-list">
    <el-card class="filter-card" shadow="never">
      <div class="filter-section">
        <el-input
          v-model="filters.keyword"
          placeholder="请输入时间中英文搜索"
          clearable
          class="filter-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filters.status" placeholder="时间状态" class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="已上线" value="online" />
          <el-option label="已下线" value="offline" />
        </el-select>
        <el-select v-model="filters.templateType" placeholder="时间类型" clearable class="filter-select">
          <el-option label="全部" value="" />
          <el-option label="相对时间" value="relative" />
          <el-option label="固定时间" value="fixed" />
        </el-select>
        <el-select
          v-model="filters.owner"
          placeholder="业务负责人"
          filterable
          clearable
          class="filter-select"
        >
          <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
        <div class="filter-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSearch">筛选</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="list-card" shadow="never">
      <div class="list-toolbar">
        <el-button type="primary" @click="goCreate">新建时间周期</el-button>
        <el-tooltip :content="batchTip" placement="top">
          <span>
            <el-dropdown :disabled="!hasSelection" trigger="click" @command="handleBatchCommand">
              <el-button :disabled="!hasSelection">
                批量操作
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="batch-online" :disabled="!hasOfflineSelection">
                    批量上线
                  </el-dropdown-item>
                  <el-dropdown-item command="batch-offline" :disabled="!hasOnlineSelection">
                    批量下线
                  </el-dropdown-item>
                  <el-dropdown-item command="batch-delete">批量删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </span>
        </el-tooltip>
      </div>
      <el-divider class="toolbar-divider" />
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="paginatedList"
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 'bold' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50">
          <template #header>
            <el-tooltip content="仅选中当前页时间周期" placement="top">
              <el-checkbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="nameCn" label="时间周期中文名" min-width="140">
          <template #default="{ row }">
            <el-tooltip :content="row.nameCn" placement="top">
              <el-link type="primary" @click="openDetailDrawer(row)">{{ row.nameCn }}</el-link>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="nameEn" label="时间周期英文名" min-width="140" />
        <el-table-column prop="templateType" label="模板类型" width="110">
          <template #default="{ row }">
            {{ row.templateType === 'relative' ? '相对时间' : '固定时间' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'info'" size="small">
              {{ row.status === 'online' ? '已上线' : '已下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="引用数" width="100">
          <template #default="{ row }">
            <el-link
              v-if="row.refCount > 0"
              type="primary"
              @click="openRefDetailDialog(row)"
            >
              {{ row.refCount }}
            </el-link>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column prop="ownerName" label="负责人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-tooltip :content="getEditTip(row)" placement="top">
              <span>
                <el-button
                  link
                  type="primary"
                  :disabled="!canEdit(row)"
                  @click="goEdit(row.id)"
                >
                  编辑
                </el-button>
              </span>
            </el-tooltip>
            <el-dropdown trigger="click" @command="(cmd) => handleMoreAction(cmd, row)">
              <el-button link type="primary">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item command="transfer-owner">转移负责人</el-dropdown-item>
                <el-dropdown-item command="online" :disabled="row.status === 'online'">
                  上线
                </el-dropdown-item>
                <el-dropdown-item command="offline" :disabled="row.status === 'offline'">
                  下线
                </el-dropdown-item>
                <el-dropdown-item command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && filteredList.length === 0" description="暂无时间周期" />

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <TimePeriodFormDrawer
      v-model="formDrawer.visible"
      :mode="formDrawer.mode"
      :period="formDrawer.period"
      @success="handleFormSuccess"
      @switch-to-edit="handleSwitchToEdit"
    />
    <RefDetailDialog v-model="refDetailDialog.visible" :period="refDetailDialog.period" />
    <TransferOwnerDialog
      v-model="transferDialog.visible"
      :indicators="transferDialog.indicators"
      @success="handleTransferSuccess"
    />
    <OfflineDialog
      v-model="offlineDialog.visible"
      :periods="offlineDialog.periods"
      @success="handleOfflineSuccess"
    />
    <DeleteDialog
      v-model="deleteDialog.visible"
      :periods="deleteDialog.periods"
      @success="handleDeleteSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import { timePeriods, users, currentUser, isIndicatorAdmin } from '@/mock/data'

function getOwnerName(ownerId: string): string {
  const u = users.find((x) => x.id === ownerId)
  return u?.name || ''
}
import type { TimePeriod } from '@/types'
import TimePeriodFormDrawer from './TimePeriodFormDrawer.vue'
import RefDetailDialog from './RefDetailDialog.vue'
import TransferOwnerDialog from './TransferOwnerDialog.vue'
import OfflineDialog from './OfflineDialog.vue'
import DeleteDialog from './DeleteDialog.vue'

const tableRef = ref()
const loading = ref(false)
const selectedRows = ref<TimePeriod[]>([])
const list = ref<TimePeriod[]>([])

const filters = ref({
  keyword: '',
  status: '' as string,
  templateType: '' as string,
  owner: '',
})

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
})

const formDrawer = ref<{
  visible: boolean
  mode: 'create' | 'edit' | 'detail'
  period: TimePeriod | null
}>({
  visible: false,
  mode: 'create',
  period: null,
})
const refDetailDialog = ref<{ visible: boolean; period: TimePeriod | null }>({
  visible: false,
  period: null,
})
const transferDialog = ref<{ visible: boolean; indicators: TimePeriod[] }>({
  visible: false,
  indicators: [],
})
const offlineDialog = ref<{ visible: boolean; periods: TimePeriod[] }>({
  visible: false,
  periods: [],
})
const deleteDialog = ref<{ visible: boolean; periods: TimePeriod[] }>({
  visible: false,
  periods: [],
})

const filteredList = computed(() => {
  let result = [...list.value]
  if (filters.value.keyword) {
    const kw = filters.value.keyword.toLowerCase()
    result = result.filter(
      (i) =>
        i.nameCn.includes(filters.value.keyword) ||
        i.nameEn.toLowerCase().includes(kw)
    )
  }
  if (filters.value.status) {
    result = result.filter((i) => i.status === filters.value.status)
  }
  if (filters.value.templateType) {
    result = result.filter((i) => i.templateType === filters.value.templateType)
  }
  if (filters.value.owner) {
    result = result.filter((i) => i.owner === filters.value.owner)
  }
  result.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
  pagination.value.total = result.length
  return result
})

const paginatedList = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  return filteredList.value.slice(start, start + pagination.value.pageSize)
})

const hasSelection = computed(() => selectedRows.value.length > 0)
const hasOfflineSelection = computed(
  () => selectedRows.value.some((p) => p.status === 'offline')
)
const hasOnlineSelection = computed(
  () => selectedRows.value.some((p) => p.status === 'online')
)
const batchTip = '请选择至少1个指标'

const isAllSelected = computed(
  () =>
    paginatedList.value.length > 0 &&
    selectedRows.value.length === paginatedList.value.length
)
const isIndeterminate = computed(
  () =>
    selectedRows.value.length > 0 &&
    selectedRows.value.length < paginatedList.value.length
)

function canEdit(row: TimePeriod): boolean {
  if (isIndicatorAdmin) return true
  return row.owner === currentUser.id
}

function getEditTip(row: TimePeriod): string {
  if (!canEdit(row)) return '仅指标负责人可操作'
  return '编辑'
}

function handleSelectionChange(rows: TimePeriod[]) {
  selectedRows.value = rows
}

function handleSelectAll(val: boolean) {
  paginatedList.value.forEach((row) => {
    tableRef.value?.toggleRowSelection(row, val)
  })
}

function handleSearch() {
  pagination.value.page = 1
}

function handleReset() {
  filters.value = { keyword: '', status: '' as string, templateType: '', owner: '' }
  pagination.value.page = 1
}

function handlePageChange() {}

function goCreate() {
  formDrawer.value = { visible: true, mode: 'create', period: null }
}

function goEdit(id: string) {
  const period = list.value.find((p) => p.id === id)
  formDrawer.value = { visible: true, mode: 'edit', period: period || null }
}

function openDetailDrawer(period: TimePeriod) {
  formDrawer.value = { visible: true, mode: 'detail', period }
}

function handleFormSuccess(data?: Partial<TimePeriod>) {
  if (data && formDrawer.value.mode === 'create') {
    const newPeriod: TimePeriod = {
      id: `tp-${Date.now()}`,
      nameCn: data.nameCn || '',
      nameEn: data.nameEn || '',
      templateType: data.templateType || 'relative',
      status: 'online',
      refCount: 0,
      owner: currentUser.id,
      ownerName: getOwnerName(currentUser.id),
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      ...data,
    }
    list.value = [newPeriod, ...list.value]
  } else if (data && formDrawer.value.mode === 'edit' && formDrawer.value.period) {
    const idx = list.value.findIndex((p) => p.id === formDrawer.value.period?.id)
    if (idx >= 0) {
      list.value[idx] = { ...list.value[idx], ...data, status: 'online' }
    }
  } else {
    loadData()
  }
}

function handleSwitchToEdit() {
  const period = formDrawer.value.period
  formDrawer.value = { visible: false, mode: 'edit', period }
  setTimeout(() => {
    formDrawer.value = { visible: true, mode: 'edit', period }
  }, 50)
}

function openRefDetailDialog(period: TimePeriod) {
  refDetailDialog.value = { visible: true, period }
}

function handleBatchCommand(command: string) {
  if (!hasSelection.value) return
  if (command === 'batch-online') {
    handleBatchOnline()
  } else if (command === 'batch-offline') {
    offlineDialog.value = { visible: true, periods: [...selectedRows.value] }
  } else if (command === 'batch-delete') {
    deleteDialog.value = { visible: true, periods: [...selectedRows.value] }
  }
}

function handleBatchOnline() {
  const toOnline = selectedRows.value.filter((p) => p.status === 'offline')
  if (toOnline.length === 0) return
  for (const p of toOnline) {
    const item = list.value.find((i) => i.id === p.id)
    if (item) item.status = 'online'
  }
  ElMessage.success('时间周期上线成功')
}

function handleMoreAction(cmd: string, row: TimePeriod) {
  if (cmd === 'transfer-owner') {
    transferDialog.value = { visible: true, indicators: [row] }
  } else if (cmd === 'online') {
    if (row.status === 'offline') {
      const item = list.value.find((i) => i.id === row.id)
      if (item) item.status = 'online'
      ElMessage.success('时间周期上线成功')
    }
  } else if (cmd === 'offline') {
    offlineDialog.value = { visible: true, periods: [row] }
  } else if (cmd === 'delete') {
    deleteDialog.value = { visible: true, periods: [row] }
  }
}

function handleTransferSuccess() {
  loadData()
}

function handleOfflineSuccess(offlinedPeriods: TimePeriod[]) {
  for (const p of offlinedPeriods) {
    const item = list.value.find((i) => i.id === p.id)
    if (item) item.status = 'offline'
  }
  offlineDialog.value = { visible: false, periods: [] }
}

function handleDeleteSuccess(deletedIds: string[]) {
  list.value = list.value.filter((i) => !deletedIds.includes(i.id))
  pagination.value.total = list.value.length
  deleteDialog.value = { visible: false, periods: [] }
}

function loadData() {
  loading.value = true
  setTimeout(() => {
    list.value = JSON.parse(JSON.stringify(timePeriods))
    pagination.value.total = list.value.length
    loading.value = false
  }, 300)
}

onMounted(loadData)
</script>

<style scoped>
.time-period-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card,
.list-card {
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.filter-card :deep(.el-card__body),
.list-card :deep(.el-card__body) {
  padding: 20px;
}

.filter-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: end;
}

.filter-input,
.filter-select {
  width: 100%;
}

.filter-select :deep(.el-input__wrapper) {
  background-color: #f5f7fa;
}

.filter-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 12px;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-divider {
  margin: 16px 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
