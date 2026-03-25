<template>
  <div class="atomic-indicator-list">
    <div class="list-layout">
      <!-- 左侧树导航 -->
      <div class="tree-panel" :class="{ collapsed: treePanelCollapsed }">
        <div class="tree-panel-inner">
          <el-input
            v-model="treeKeyword"
            placeholder="请输入关键字搜索"
            clearable
            class="tree-search"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="{ label: 'label', children: 'children' }"
            node-key="id"
            :filter-node-method="filterTreeNode"
            :expand-on-click-node="false"
            highlight-current
            default-expand-all
            class="catalog-tree"
            @node-click="handleTreeSelect"
          />
        </div>
        <div class="tree-toggle" @click="treePanelCollapsed = !treePanelCollapsed">
          <el-icon>
            <component :is="treePanelCollapsed ? DArrowRight : DArrowLeft" />
          </el-icon>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="content-area">
    <el-card class="filter-card" shadow="never">
      <div class="filter-section">
        <el-input
          v-model="filters.keyword"
          placeholder="请输入指标中英文搜索"
          clearable
          class="filter-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filters.status" placeholder="指标状态" clearable class="filter-select">
          <el-option label="已上线" value="online" />
          <el-option label="已下线" value="offline" />
        </el-select>
        <el-select
          v-model="filters.bizOwner"
          placeholder="业务负责人"
          filterable
          clearable
          class="filter-select"
        >
          <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
        <el-select
          v-model="filters.techOwner"
          placeholder="技术负责人"
          filterable
          clearable
          class="filter-select"
        >
          <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
        <el-cascader
          v-model="filters.assetCatalog"
          :options="assetCatalogOptions"
          :props="{ checkStrictly: true, emitPath: false }"
          placeholder="所属目录"
          clearable
          class="filter-cascader"
        />
        <div class="filter-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSearch">筛选</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="list-card" shadow="never">
      <div class="list-toolbar">
        <el-button type="primary" @click="goCreate">新建原子指标</el-button>
        <el-tooltip :content="batchTip" placement="top">
          <span>
            <el-dropdown
              :disabled="!hasSelection"
              trigger="click"
              @command="handleBatchCommand"
            >
              <el-button :disabled="!hasSelection">
                批量操作
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="transfer-biz">转移业务负责人</el-dropdown-item>
                  <el-dropdown-item command="transfer-tech">转移技术负责人</el-dropdown-item>
                  <el-dropdown-item command="add-collaborator">添加协作人</el-dropdown-item>
                  <el-dropdown-item command="batch-online" :disabled="!hasOfflineSelection">
                    批量上线
                  </el-dropdown-item>
                  <el-dropdown-item command="batch-offline">批量下线</el-dropdown-item>
                  <el-dropdown-item command="batch-delete">批量删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </span>
        </el-tooltip>
      </div>
      <el-divider class="toolbar-divider" />
      <el-table
        v-loading="loading"
        :data="filteredList"
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 'bold' }"
        @selection-change="handleSelectionChange"
      >
          <el-table-column type="selection" width="50" />
        <el-table-column prop="nameCn" label="指标中文" min-width="140">
          <template #default="{ row }">
            <el-link type="primary" @click="goDetail(row.id)">{{ row.nameCn }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="nameEn" label="指标英文" min-width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'info'" size="small">
              {{ row.status === 'online' ? '已上线' : '已下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="modelName" label="关联模型" min-width="120" />
        <el-table-column label="引用数" width="90">
          <template #default="{ row }">
            <el-link
              v-if="getRefCount(row) > 0"
              type="primary"
              @click="openRefDetailDialog(row)"
            >
              {{ getRefCount(row) }}
            </el-link>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column prop="bizOwnerName" label="业务负责人" width="110" />
        <el-table-column prop="techOwnerName" label="技术负责人" width="110" />
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
                  <el-dropdown-item
                    command="transfer-biz"
                    :disabled="!canTransferOwner(row)"
                  >
                    转移业务负责人
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="transfer-tech"
                    :disabled="!canTransferOwner(row)"
                  >
                    转移技术负责人
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="collaborator"
                    :disabled="!canTransferOwner(row)"
                  >
                    管理协作人
                  </el-dropdown-item>
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

      <el-empty v-if="!loading && filteredList.length === 0" description="暂无原子指标" />

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

    <TransferOwnerDialog
      v-model="transferDialog.visible"
      :type="transferDialog.type"
      :indicators="selectedRows"
      @success="handleTransferSuccess"
    />
    <AddCollaboratorDialog
      v-model="addCollaboratorDialog.visible"
      :indicators="selectedRows"
      @success="handleAddCollaboratorSuccess"
    />
    <ManageCollaboratorDialog
      v-model="manageCollaboratorDialog.visible"
      :indicator="manageCollaboratorDialog.indicator"
      @success="handleManageCollaboratorSuccess"
    />
    <OfflineDialog
      v-model="offlineDialog.visible"
      :indicators="offlineDialog.indicators"
      @success="handleOfflineSuccess"
    />
    <DeleteDialog
      v-model="deleteDialog.visible"
      :indicators="deleteDialog.indicators"
      @success="handleDeleteSuccess"
    />
    <AtomicRefDetailDialog
      v-model="refDetailDialog.visible"
      :indicator="refDetailDialog.indicator"
    />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, Search, DArrowLeft, DArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  atomicIndicators,
  users,
  assetCatalog,
  indicatorCatalogTree,
  derivedIndicatorsByAtomic,
  currentUser,
  isIndicatorAdmin,
} from '@/mock/data'
import type { AtomicIndicator, AssetCatalogNode } from '@/types'
import TransferOwnerDialog from './dialogs/TransferOwnerDialog.vue'
import AtomicRefDetailDialog from './dialogs/AtomicRefDetailDialog.vue'
import AddCollaboratorDialog from './dialogs/AddCollaboratorDialog.vue'
import ManageCollaboratorDialog from './dialogs/ManageCollaboratorDialog.vue'
import OfflineDialog from './dialogs/OfflineDialog.vue'
import DeleteDialog from './dialogs/DeleteDialog.vue'

const router = useRouter()
const loading = ref(false)
const selectedRows = ref<AtomicIndicator[]>([])
const list = ref<AtomicIndicator[]>([])
const treeRef = ref()
const treeKeyword = ref('')
const treePanelCollapsed = ref(false)
const selectedCatalogId = ref<string>('')

const treeData = computed(() => indicatorCatalogTree)

const filters = ref({
  keyword: '',
  status: '' as string,
  bizOwner: '',
  techOwner: '',
  assetCatalog: [] as string[],
})

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
})

const transferDialog = ref({
  visible: false,
  type: 'biz' as 'biz' | 'tech',
})

const addCollaboratorDialog = ref({ visible: false })
const manageCollaboratorDialog = ref<{ visible: boolean; indicator: AtomicIndicator | null }>({
  visible: false,
  indicator: null,
})
const offlineDialog = ref<{ visible: boolean; indicators: AtomicIndicator[] }>({
  visible: false,
  indicators: [],
})
const deleteDialog = ref<{ visible: boolean; indicators: AtomicIndicator[] }>({
  visible: false,
  indicators: [],
})
const refDetailDialog = ref<{ visible: boolean; indicator: AtomicIndicator | null }>({
  visible: false,
  indicator: null,
})

function mapCatalogToOptions(nodes: AssetCatalogNode[]): Array<{ value: string; label: string; children?: ReturnType<typeof mapCatalogToOptions> }> {
  return nodes.map((c) => ({
    value: c.id,
    label: c.label,
    children: c.children?.length ? mapCatalogToOptions(c.children) : undefined,
  }))
}
const assetCatalogOptions = computed(() => mapCatalogToOptions(assetCatalog))

const hasOfflineSelection = computed(() =>
  selectedRows.value.some((r) => r.status === 'offline')
)

function filterTreeNode(value: string, data: { label: string }) {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

watch(treeKeyword, (val) => {
  treeRef.value?.filter(val)
})

function handleTreeSelect(data: { id: string }) {
  selectedCatalogId.value = data.id
  pagination.value.page = 1
}

const filteredList = computed(() => {
  let result = [...list.value]
  if (selectedCatalogId.value) {
    result = result.filter((i) => i.assetCatalog?.includes(selectedCatalogId.value))
  }
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
  if (filters.value.bizOwner) {
    result = result.filter((i) => i.bizOwner === filters.value.bizOwner)
  }
  if (filters.value.techOwner) {
    result = result.filter((i) => i.techOwner === filters.value.techOwner)
  }
  if (filters.value.assetCatalog?.length) {
    const catId = Array.isArray(filters.value.assetCatalog)
      ? filters.value.assetCatalog[filters.value.assetCatalog.length - 1]
      : filters.value.assetCatalog
    result = result.filter((i) => i.assetCatalog?.includes(catId))
  }
  result.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
  pagination.value.total = result.length
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  return result.slice(start, start + pagination.value.pageSize)
})

const hasSelection = computed(() => selectedRows.value.length > 0)
const batchTip = '请选择至少1个指标'

function canEdit(row: AtomicIndicator): boolean {
  if (row.status === 'offline') return false
  if (isIndicatorAdmin) return true
  if (row.bizOwner === currentUser.id || row.techOwner === currentUser.id) return true
  if (row.collaborators?.includes(currentUser.id)) return true
  return false
}

function getEditTip(row: AtomicIndicator): string {
  if (!canEdit(row)) return '无权限编辑该指标，请联系指标负责人'
  return '编辑'
}

function canTransferOwner(row: AtomicIndicator): boolean {
  if (isIndicatorAdmin) return true
  if (row.bizOwner === currentUser.id || row.techOwner === currentUser.id) return true
  return false
}

function handleSelectionChange(rows: AtomicIndicator[]) {
  selectedRows.value = rows
}

function handleSearch() {
  pagination.value.page = 1
}

function handleReset() {
  filters.value = {
    keyword: '',
    status: '',
    bizOwner: '',
    techOwner: '',
    assetCatalog: [],
  }
  pagination.value.page = 1
}

function handlePageChange() {}

function goCreate() {
  const leafId = selectedCatalogId.value || (Array.isArray(filters.value.assetCatalog) ? filters.value.assetCatalog[filters.value.assetCatalog.length - 1] : filters.value.assetCatalog)
  const query = leafId ? { catalog: leafId } : undefined
  router.push({ path: '/atomic-indicators/create', query })
}

function goDetail(id: string) {
  router.push(`/atomic-indicators/detail/${id}`)
}

function goEdit(id: string) {
  router.push(`/atomic-indicators/edit/${id}`)
}

function getRefCount(row: AtomicIndicator): number {
  return derivedIndicatorsByAtomic[row.id]?.length || 0
}

function openRefDetailDialog(row: AtomicIndicator) {
  refDetailDialog.value = { visible: true, indicator: row }
}

function handleBatchCommand(command: string) {
  if (!hasSelection.value) return
  if (command === 'transfer-biz') {
    transferDialog.value = { visible: true, type: 'biz' }
  } else if (command === 'transfer-tech') {
    transferDialog.value = { visible: true, type: 'tech' }
  } else if (command === 'add-collaborator') {
    addCollaboratorDialog.value.visible = true
  } else if (command === 'batch-online') {
    const offlineRows = selectedRows.value.filter((r) => r.status === 'offline')
    offlineRows.forEach((r) => { r.status = 'online' })
    ElMessage.success('原子指标上线成功')
  } else if (command === 'batch-offline') {
    offlineDialog.value = { visible: true, indicators: [...selectedRows.value] }
  } else if (command === 'batch-delete') {
    deleteDialog.value = { visible: true, indicators: [...selectedRows.value] }
  }
}

function handleMoreAction(cmd: string, row: AtomicIndicator) {
  if (cmd === 'transfer-biz') {
    selectedRows.value = [row]
    transferDialog.value = { visible: true, type: 'biz' }
  } else if (cmd === 'transfer-tech') {
    selectedRows.value = [row]
    transferDialog.value = { visible: true, type: 'tech' }
  } else if (cmd === 'collaborator') {
    manageCollaboratorDialog.value = { visible: true, indicator: row }
  } else if (cmd === 'online') {
    row.status = 'online'
    ElMessage.success('原子指标上线成功')
  } else if (cmd === 'offline') {
    offlineDialog.value = { visible: true, indicators: [row] }
  } else if (cmd === 'delete') {
    deleteDialog.value = { visible: true, indicators: [row] }
  }
}

function handleTransferSuccess() {
  loadData()
}

function handleAddCollaboratorSuccess() {
  loadData()
}

function handleManageCollaboratorSuccess() {
  loadData()
}

function handleOfflineSuccess(offlinedIndicators: AtomicIndicator[]) {
  for (const ind of offlinedIndicators) {
    const item = list.value.find((i) => i.id === ind.id)
    if (item) item.status = 'offline'
  }
  offlineDialog.value = { visible: false, indicators: [] }
}

function handleDeleteSuccess(deletedIds: string[]) {
  list.value = list.value.filter((i) => !deletedIds.includes(i.id))
  pagination.value.total = list.value.length
  deleteDialog.value = { visible: false, indicators: [] }
}

function loadData() {
  loading.value = true
  setTimeout(() => {
    list.value = JSON.parse(JSON.stringify(atomicIndicators))
    pagination.value.total = list.value.length
    loading.value = false
  }, 300)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.atomic-indicator-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 0;
}

.tree-panel {
  position: relative;
  width: 240px;
  min-width: 240px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-right: 16px;
  transition: width 0.2s, min-width 0.2s;
}

.tree-panel.collapsed {
  width: 48px;
  min-width: 48px;
  margin-right: 0;
}

.tree-panel.collapsed .tree-panel-inner {
  display: none;
}

.tree-panel-inner {
  padding: 16px;
  height: 100%;
  overflow: auto;
}

.tree-search {
  margin-bottom: 12px;
}

.tree-search :deep(.el-input__wrapper) {
  background-color: #f5f7fa;
}

.catalog-tree {
  border: none;
}

.catalog-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  color: #409eff;
}

.tree-toggle {
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 0 4px 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.06);
}

.tree-toggle:hover {
  background: #f5f7fa;
  color: #409eff;
}

.tree-panel.collapsed .tree-toggle {
  right: -36px;
  border-radius: 4px;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
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
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  align-items: end;
}

.filter-input,
.filter-select,
.filter-cascader {
  width: 100%;
}

.filter-select :deep(.el-input__wrapper),
.filter-cascader :deep(.el-input__wrapper) {
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
