<template>
  <div v-loading="loading" class="atomic-indicator-detail">
    <template v-if="indicator">
      <div class="basic-info">
        <h3 class="section-title">基本信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="指标中文名">{{ indicator.nameCn }}</el-descriptions-item>
          <el-descriptions-item label="指标英文名">{{ indicator.nameEn }}</el-descriptions-item>
          <el-descriptions-item label="指标口径" :span="2">{{ indicator.description }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="indicator.status === 'online' ? 'success' : 'info'" size="small">
              {{ indicator.status === 'online' ? '已上线' : '已下线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资产目录">{{ assetCatalogText }}</el-descriptions-item>
          <el-descriptions-item label="业务负责人">{{ indicator.bizOwnerName }}</el-descriptions-item>
          <el-descriptions-item label="技术负责人">{{ indicator.techOwnerName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ indicator.createTime }}</el-descriptions-item>
          <el-descriptions-item label="最近更新时间">{{ indicator.updateTime }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-actions">
          <el-button type="primary" :disabled="!canEdit" @click="goEdit">
            编辑
          </el-button>
        </div>
      </div>

      <div class="professional-info">
        <h3 class="section-title">专业信息</h3>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="技术信息" name="tech">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="关联模型">{{ indicator.modelName }}</el-descriptions-item>
              <el-descriptions-item label="计算逻辑">{{ indicator.expression }}</el-descriptions-item>
              <el-descriptions-item label="适用维度">
                {{ indicator.applicableDimensions?.join(', ') || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="时间周期">
                {{ indicator.timeDimension || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="数据血缘" name="lineage">
            <el-table :data="downstreamList" style="width: 100%">
              <el-table-column prop="name" label="指标名称" min-width="140">
                <template #default="{ row }">
                  <el-link type="primary" @click="goToIndicatorDetail(row.id)">
                    {{ row.name }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'online' ? 'success' : 'info'" size="small">
                    {{ row.status === 'online' ? '已上线' : '已下线' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="owner" label="负责人" width="120" />
              <el-table-column prop="createTime" label="创建时间" width="170" />
            </el-table>
            <el-empty
              v-if="downstreamList.length === 0"
              description="暂无下游指标引用该原子指标"
            />
            <div v-if="downstreamList.length > 0" class="pagination">
              <el-pagination
                v-model:current-page="lineagePage"
                :page-size="10"
                :total="downstreamList.length"
                layout="total, prev, pager, next"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
    <el-empty v-else-if="!loading" description="指标不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { atomicIndicators, assetCatalog, currentUser, isIndicatorAdmin, baseIndicatorsByAtomic } from '@/mock/data'
import type { AtomicIndicator } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const indicator = ref<AtomicIndicator | null>(null)
const activeTab = ref('tech')
const lineagePage = ref(1)

const assetCatalogText = computed(() => {
  if (!indicator.value?.assetCatalog?.length) return '-'
  const ids = indicator.value.assetCatalog
  const labels: string[] = []
  for (const id of ids) {
    for (const c of assetCatalog) {
      if (c.id === id) {
        labels.push(c.label)
        break
      }
      const child = c.children?.find((ch) => ch.id === id)
      if (child) {
        labels.push(`${c.label} / ${child.label}`)
        break
      }
    }
  }
  return labels.join(' / ') || '-'
})

const downstreamList = computed(() => {
  if (!indicator.value) return []
  const refs = baseIndicatorsByAtomic[indicator.value.id] || []
  const start = (lineagePage.value - 1) * 10
  return refs.slice(start, start + 10)
})

const canEdit = computed(() => {
  if (!indicator.value || indicator.value.status === 'offline') return false
  if (isIndicatorAdmin) return true
  if (
    indicator.value.bizOwner === currentUser.id ||
    indicator.value.techOwner === currentUser.id
  )
    return true
  if (indicator.value.collaborators?.includes(currentUser.id)) return true
  return false
})

function goEdit() {
  if (indicator.value) router.push(`/atomic-indicators/edit/${indicator.value.id}`)
}

function goToIndicatorDetail(id: string) {
  router.push(`/atomic-indicators/detail/${id}`)
}

function loadDetail() {
  const id = route.params.id as string
  const ind = atomicIndicators.find((i) => i.id === id)
  loading.value = true
  setTimeout(() => {
    indicator.value = ind ? { ...ind } : null
    loading.value = false
  }, 200)
}

onMounted(loadDetail)
</script>

<style scoped>
.atomic-indicator-detail {
  min-height: 400px;
}
.section-title {
  font-size: 16px;
  margin-bottom: 16px;
}
.basic-info,
.professional-info {
  margin-bottom: 32px;
}
.detail-actions {
  margin-top: 16px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
