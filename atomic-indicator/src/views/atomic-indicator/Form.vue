<template>
  <div class="atomic-indicator-form">
    <h2 class="page-title">{{ isEdit ? `指标名称：${form.nameCn || '---'}` : '新建原子指标' }}</h2>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="form-content">
      <el-divider content-position="left">业务信息（必填）</el-divider>
      <el-form-item label="指标中文名" prop="nameCn">
        <el-input
          v-model="form.nameCn"
          placeholder="请输入指标的中文名称"
          :disabled="!isFieldEditable('nameCn')"
          maxlength="30"
          show-word-limit
          @blur="validateNameCnUnique"
        />
      </el-form-item>
      <el-form-item label="指标英文名" prop="nameEn">
        <el-input
          v-model="form.nameEn"
          placeholder="请输入指标的英文名称"
          :disabled="!isFieldEditable('nameEn')"
          maxlength="30"
          show-word-limit
          @blur="validateNameEnUnique"
        />
      </el-form-item>
      <el-form-item label="指标口径描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入指标的业务口径"
          :disabled="!isFieldEditable('description')"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-divider content-position="left">管理信息（必填）</el-divider>
      <el-form-item label="所属目录" prop="assetCatalog">
        <el-popover
          v-model:visible="catalogPopoverVisible"
          placement="bottom-start"
          :width="320"
          trigger="manual"
          popper-class="catalog-tree-popper"
        >
          <div class="catalog-tree-dropdown">
            <el-tree
              ref="catalogTreeRef"
              :data="catalogTreeData"
              :props="{ label: 'label' }"
              node-key="id"
              :default-expand-all="true"
              :current-node-key="selectedCatalogLeafId"
              highlight-current
              class="catalog-tree"
              @node-click="handleCatalogNodeClick"
            />
          </div>
          <template #reference>
            <el-input
              ref="catalogInputRef"
              :model-value="selectedCatalogLabel"
              placeholder="请选择所属目录（仅叶子目录可创建指标）"
              readonly
              :disabled="!isFieldEditable('assetCatalog')"
              class="catalog-select-input"
              @click="toggleCatalogPopover"
            >
              <template #suffix>
                <el-icon class="el-input__icon"><ArrowDown /></el-icon>
              </template>
            </el-input>
          </template>
        </el-popover>
      </el-form-item>
      <el-form-item label="主体" prop="subject">
        <el-cascader
          v-model="form.subjectList"
          :options="subjectOptions"
          :props="{ multiple: true, emitPath: false, checkStrictly: true }"
          placeholder="请选择主体"
          :disabled="!isFieldEditable('subject')"
          style="width: 100%"
          clearable
          collapse-tags
          collapse-tags-tooltip
        />
      </el-form-item>
      <el-form-item label="业务负责人" prop="bizOwner">
        <el-select
          v-model="form.bizOwner"
          filterable
          placeholder="请选择"
          :disabled="!isFieldEditable('bizOwner')"
          style="width: 100%"
        >
          <el-option
            v-for="u in users"
            :key="u.id"
            :label="u.name"
            :value="u.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="技术负责人" prop="techOwner">
        <el-select
          v-model="form.techOwner"
          filterable
          placeholder="请选择"
          :disabled="!isFieldEditable('techOwner')"
          style="width: 100%"
        >
          <el-option
            v-for="u in users"
            :key="u.id"
            :label="u.name"
            :value="u.id"
          />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">技术信息（必填）</el-divider>
      <el-form-item label="模型选择" prop="modelId">
        <el-input
          :model-value="selectedModelName"
          placeholder="请选择模型"
          readonly
          :disabled="!isFieldEditable('modelId')"
          @click="openModelDialog"
        >
          <template #append>
            <el-button :disabled="!isFieldEditable('modelId')" @click="openModelDialog">
              选择模型
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="设定表达式" prop="expression" required>
        <div class="expression-wrapper">
          <div class="expression-layout">
            <div class="expr-panel func-panel">
              <div class="panel-title">函数</div>
              <div class="func-combined-input">
                <el-select
                  v-model="exprFuncCategory"
                  placeholder="全部"
                  clearable
                  size="small"
                  class="func-category-select"
                >
                  <el-option label="全部" value="" />
                  <el-option label="聚合函数" value="aggregate" />
                  <el-option label="日期函数" value="date" />
                  <el-option label="字符串函数" value="string" />
                  <el-option label="数值函数" value="numeric" />
                  <el-option label="类型转化函数" value="cast" />
                </el-select>
                <el-input
                  v-model="funcSearch"
                  placeholder="搜索函数"
                  size="small"
                  clearable
                  class="func-search-input"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
              <div class="func-list">
                <el-tooltip
                  v-for="fn in filteredExprFunctions"
                  :key="fn.id"
                  placement="right"
                  :show-after="300"
                >
                  <template #content>
                    <div class="func-tooltip">
                      <div v-if="fn.usage"><strong>用法：</strong>{{ fn.usage }}</div>
                      <div v-if="fn.description"><strong>说明：</strong>{{ fn.description }}</div>
                      <div v-if="fn.example"><strong>示例：</strong>{{ fn.example }}</div>
                    </div>
                  </template>
                  <div class="func-item" @click="insertExprFunc(fn)">{{ fn.name }}</div>
                </el-tooltip>
              </div>
            </div>
            <div class="expr-panel field-panel">
              <div class="panel-title">字段</div>
              <el-input
                v-model="fieldSearch"
                placeholder="搜索"
                size="small"
                clearable
                class="field-search-input"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="field-list">
                <el-tag
                  v-for="f in filteredFields"
                  :key="f.id"
                  class="func-tag"
                  @click="insertField(f.name)"
                >
                  {{ f.name }}
                </el-tag>
              </div>
            </div>
            <div class="expr-panel formula-panel">
              <div class="formula-header">
                <span class="panel-title required">计算公式</span>
                <el-button type="primary" link size="small" @click="formatExpression">格式化</el-button>
              </div>
              <el-input
                v-model="form.expression"
                type="textarea"
                :rows="8"
                placeholder="示例:SUM([A]) + SUM([B])，请使用英文标点符号"
                :disabled="!isFieldEditable('expression')"
                class="formula-textarea"
              />
              <div v-if="expressionError" class="expr-error">{{ expressionError }}</div>
            </div>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="适用维度" prop="applicableDimensions">
        <el-select
          v-model="form.applicableDimensions"
          multiple
          placeholder="请选择"
          :disabled="!form.modelId || !isFieldEditable('applicableDimensions')"
          style="width: 100%"
        >
          <el-option
            v-for="f in modelFields"
            :key="f.id"
            :label="f.name"
            :value="f.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="时间维度" prop="timeDimension">
        <el-select
          v-model="form.timeDimension"
          placeholder="请选择"
          :disabled="!form.modelId || !isFieldEditable('timeDimension')"
          style="width: 100%"
        >
          <el-option
            v-for="f in timeFields"
            :key="f.id"
            :label="f.name"
            :value="f.name"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="isEdit && indicator?.status === 'offline'"
        @click="handleSave"
      >
        保存
      </el-button>
    </div>

    <el-dialog
      v-model="modelDialogVisible"
      title="选择模型"
      width="720px"
      append-to-body
      @close="modelDialogVisible = false"
    >
      <div class="model-dialog-content">
        <div class="model-list">
          <el-input
            v-model="modelSearchKeyword"
            placeholder="请输入模型中/英文"
            style="margin-bottom: 12px"
          />
          <el-table
            :data="filteredModels"
            highlight-current-row
            @current-change="handleModelSelect"
          >
            <el-table-column prop="nameCn" label="模型中文" />
            <el-table-column prop="nameEn" label="模型英文" />
          </el-table>
        </div>
        <div class="model-detail">
          <div v-if="modelDialogSelected" class="detail-content">
            <p><strong>模型名称：</strong>{{ modelDialogSelected.nameCn }}</p>
            <p><strong>字段列表：</strong></p>
            <ul>
              <li v-for="f in modelDialogSelected.fields" :key="f.id">
                {{ f.name }} ({{ f.type }})
              </li>
            </ul>
          </div>
          <el-empty v-else description="请选择模型" />
        </div>
      </div>
      <template #footer>
        <el-button @click="modelDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmModelSelect"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="cancelDialogVisible"
      title="取消创建"
      width="420px"
      append-to-body
    >
      <p>确定取消创建原子指标吗？已输入的内容将不会保存</p>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCancel">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import {
  atomicIndicators,
  users,
  assetCatalog,
  subjectOptions,
  models,
  expressionFunctions,
  currentUser,
} from '@/mock/data'
import type { AtomicIndicator, AssetCatalogNode, Model } from '@/types'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const cancelDialogVisible = ref(false)
const modelDialogVisible = ref(false)
const modelDialogSelected = ref<Model | null>(null)
const modelSearchKeyword = ref('')
const funcSearch = ref('')
const fieldSearch = ref('')
const exprFuncCategory = ref<string>('')

const isEdit = computed(() => !!route.params.id)
const indicator = ref<AtomicIndicator | null>(null)

const editableInOnlineEdit = new Set(['nameCn', 'description', 'assetCatalog', 'applicableDimensions'])
function isFieldEditable(field: string): boolean {
  if (!isEdit.value) return true
  if (indicator.value?.status === 'offline') return false
  return editableInOnlineEdit.has(field)
}

const form = ref({
  nameCn: '',
  nameEn: '',
  description: '',
  assetCatalog: [] as string[],
  subject: '',
  subjectList: [] as string[],
  bizOwner: '',
  techOwner: '',
  modelId: '',
  expression: '',
  expressionMode: 'select' as 'select' | 'input',
  fieldId: '',
  functionId: '',
  applicableDimensions: [] as string[],
  timeDimension: '',
})


interface CatalogTreeNode {
  id: string
  label: string
  disabled?: boolean
  path?: string[]
  children?: CatalogTreeNode[]
}

function buildCatalogTree(nodes: AssetCatalogNode[], path: string[] = []): CatalogTreeNode[] {
  return nodes.map((node) => {
    const isLeaf = !node.children || node.children.length === 0
    const currentPath = [...path, node.id]
    return {
      id: node.id,
      label: node.label,
      disabled: !isLeaf,
      path: isLeaf ? currentPath : undefined,
      children: node.children ? buildCatalogTree(node.children, currentPath) : undefined,
    }
  })
}

const catalogTreeData = computed(() => buildCatalogTree(assetCatalog))
const catalogTreeRef = ref()
const catalogPopoverVisible = ref(false)
const selectedCatalogLeafId = computed(() => {
  const path = form.value.assetCatalog
  return path?.length ? path[path.length - 1] : ''
})

const selectedCatalogLabel = computed(() => {
  const path = form.value.assetCatalog
  if (!path?.length) return ''
  const labels = path.map((id) => {
    const find = (nodes: AssetCatalogNode[]): string => {
      for (const n of nodes) {
        if (n.id === id) return n.label
        if (n.children) {
          const found = find(n.children)
          if (found) return found
        }
      }
      return ''
    }
    return find(assetCatalog)
  })
  return labels.filter(Boolean).join(' / ')
})

const catalogInputRef = ref()

function toggleCatalogPopover() {
  if (!isFieldEditable('assetCatalog')) return
  catalogPopoverVisible.value = !catalogPopoverVisible.value
}

watch(catalogPopoverVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      setTimeout(() => document.addEventListener('click', handleClickOutsideCatalog), 0)
    })
  } else {
    document.removeEventListener('click', handleClickOutsideCatalog)
  }
})

function handleClickOutsideCatalog(e: MouseEvent) {
  const target = e.target as Node
  const inputEl = catalogInputRef.value?.$el ?? catalogInputRef.value
  const inInput = inputEl?.contains?.(target)
  const inPopper = document.querySelector('.catalog-tree-popper')?.contains(target)
  if (!inInput && !inPopper) {
    catalogPopoverVisible.value = false
  }
}

function handleCatalogNodeClick(data: CatalogTreeNode) {
  if (!isFieldEditable('assetCatalog')) return
  if (data.disabled) return
  if (data.path) {
    form.value.assetCatalog = [...data.path]
    catalogPopoverVisible.value = false
  }
}

const selectedModelName = computed(() => {
  const m = models.find((x) => x.id === form.value.modelId)
  return m ? m.nameCn : ''
})

const selectedModel = computed(() => models.find((m) => m.id === form.value.modelId))
const modelFields = computed(() => selectedModel.value?.fields || [])
const timeFields = computed(() =>
  modelFields.value.filter((f) => f.isTime)
)
const filteredModels = computed(() => {
  if (!modelSearchKeyword.value) return models
  const kw = modelSearchKeyword.value.toLowerCase()
  return models.filter(
    (m) =>
      m.nameCn.includes(modelSearchKeyword.value) ||
      m.nameEn.toLowerCase().includes(kw)
  )
})
const filteredExprFunctions = computed(() => {
  let list = expressionFunctions
  if (exprFuncCategory.value) {
    list = list.filter((f) => f.category === exprFuncCategory.value)
  }
  if (funcSearch.value) {
    const kw = funcSearch.value.toLowerCase()
    list = list.filter((f) => f.name.toLowerCase().includes(kw))
  }
  return list
})
const filteredFields = computed(() => {
  if (!fieldSearch.value) return modelFields.value
  const kw = fieldSearch.value.toLowerCase()
  return modelFields.value.filter((f) => f.name.toLowerCase().includes(kw))
})

const nameCnRule = [
  { required: true, message: '请输入指标中文名称', trigger: 'blur' },
  {
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/,
    message: '仅支持中文、数字、下划线',
    trigger: 'blur',
  },
  { max: 30, message: '长度不能超过30字', trigger: 'blur' },
  {
    validator: (_: unknown, value: string, cb: (e?: Error) => void) => {
      if (!value) return cb()
      const exists = atomicIndicators.some(
        (i) =>
          i.nameCn === value &&
          (!isEdit.value || i.id !== route.params.id)
      )
      exists ? cb(new Error('该指标名称已存在，请修改')) : cb()
    },
    trigger: 'blur',
  },
]
const nameEnRule = [
  { required: true, message: '请输入指标英文名称', trigger: 'blur' },
  {
    pattern: /^[a-zA-Z0-9_]+$/,
    message: '仅支持英文、数字、下划线',
    trigger: 'blur',
  },
  { max: 30, message: '长度不能超过30字', trigger: 'blur' },
  {
    validator: (_: unknown, value: string, cb: (e?: Error) => void) => {
      if (!value) return cb()
      const exists = atomicIndicators.some(
        (i) =>
          i.nameEn === value &&
          (!isEdit.value || i.id !== route.params.id)
      )
      exists ? cb(new Error('该指标名称已存在，请修改')) : cb()
    },
    trigger: 'blur',
  },
]

const rules: FormRules = {
  nameCn: nameCnRule,
  nameEn: nameEnRule,
  description: [
    { required: true, message: '请输入指标口径描述', trigger: 'blur' },
    { max: 200, message: '字数限制为200', trigger: 'blur' },
  ],
  assetCatalog: [{ required: true, message: '请选择所属目录（仅叶子目录可创建指标）', trigger: 'change' }],
  subject: [
    {
      validator: (_: unknown, _v: unknown, cb: (e?: Error) => void) => {
        if (!form.value.subjectList?.length) return cb(new Error('请选择主体'))
        cb()
      },
      trigger: 'change',
    },
  ],
  bizOwner: [{ required: true, message: '请选择业务负责人', trigger: 'change' }],
  techOwner: [{ required: true, message: '请选择技术负责人', trigger: 'change' }],
  modelId: [{ required: true, message: '请先选择模型', trigger: 'change' }],
  expression: [
    { required: true, message: '请设定计算表达式', trigger: 'blur' },
    {
      validator: (_: unknown, _v: unknown, cb: (e?: Error) => void) => {
        if (expressionError.value) return cb(new Error(expressionError.value))
        cb()
      },
      trigger: 'blur',
    },
  ],
}

function validateNameCnUnique() {
  formRef.value?.validateField('nameCn')
}

function validateNameEnUnique() {
  formRef.value?.validateField('nameEn')
}

function openModelDialog() {
  modelDialogVisible.value = true
  modelDialogSelected.value = null
}

function handleModelSelect(row: Model | null) {
  modelDialogSelected.value = row
}

function confirmModelSelect() {
  if (!modelDialogSelected.value) {
    ElMessage.warning('请先选择模型')
    return
  }
  form.value.modelId = modelDialogSelected.value.id
  modelDialogVisible.value = false
}

function formatExpression() {
  const expr = form.value.expression?.trim()
  if (!expr) return
  form.value.expression = expr.replace(/\s+/g, ' ')
}

function insertExprFunc(fn: { sql: string }) {
  form.value.expression = (form.value.expression || '') + fn.sql + '()'
}

function insertField(name: string) {
  const expr = form.value.expression || ''
  const lastEmpty = expr.lastIndexOf('()')
  if (lastEmpty >= 0) {
    form.value.expression = expr.slice(0, lastEmpty + 1) + name + expr.slice(lastEmpty + 1)
  } else {
    form.value.expression = expr + name
  }
}

const sqlReserved = new Set(['as', 'and', 'or', 'in', 'on', 'by', 'day', 'month', 'year', 'interval', 'decimal', 'null'])
const expressionError = computed(() => {
  const expr = form.value.expression?.trim()
  if (!expr) return ''
  const model = selectedModel.value
  const validFields = new Set((model?.fields || []).map((f) => f.name))
  const validFuncs = new Set(expressionFunctions.map((f) => f.name.toUpperCase()))
  const funcMatches = expr.matchAll(/([A-Z_][A-Z0-9_]*)\s*\(/g)
  for (const m of funcMatches) {
    const name = m[1].toUpperCase()
    if (!validFuncs.has(name)) return `非法函数: ${m[1]}`
  }
  const fieldMatches = [...expr.matchAll(/\b([a-z_][a-z0-9_]*)\b/g)]
  for (const fm of fieldMatches) {
    const name = fm[1].toLowerCase()
    if (sqlReserved.has(name) || validFields.has(fm[1])) continue
    return `非法字段: ${fm[1]}`
  }
  return ''
})

function handleCancel() {
  if (isEdit.value) {
    router.push('/atomic-indicators')
    return
  }
  cancelDialogVisible.value = true
}

function confirmCancel() {
  cancelDialogVisible.value = false
  router.push('/atomic-indicators')
}

async function handleSave() {
  if (!form.value.expression?.trim()) {
    ElMessage.warning('请设定计算表达式')
    return
  }
  if (expressionError.value) {
    ElMessage.warning(expressionError.value)
    return
  }

  await formRef.value?.validate().catch(() => {
    ElMessage.warning('请完善必填项')
  })

  const leafValues = ['niuniu', 'moomoo', 'futu_hk', 'futu_my', 'futu_us', 'futu_au', 'futu_sg', 'futu_ca', 'futu_jp', 'futu_th']
  const selected = (form.value.subjectList || []).filter((v) => leafValues.includes(v))
  form.value.subject = selected.join(',')

  submitting.value = true
  setTimeout(() => {
    ElMessage.success(isEdit.value ? '保存成功' : '指标创建成功')
    submitting.value = false
    router.push('/atomic-indicators')
  }, 500)
}

function loadIndicator() {
  const id = route.params.id as string
  const ind = atomicIndicators.find((i) => i.id === id)
  if (ind) {
    indicator.value = ind
    const subjectList = ind.subject ? ind.subject.split(',').map((s) => s.trim()).filter(Boolean) : []
    form.value = {
      nameCn: ind.nameCn,
      nameEn: ind.nameEn,
      description: ind.description,
      assetCatalog: ind.assetCatalog || [],
      subject: ind.subject,
      subjectList: [...subjectList],
      bizOwner: ind.bizOwner,
      techOwner: ind.techOwner,
      modelId: ind.modelId,
      expression: ind.expression,
      expressionMode: ind.expressionMode || 'select',
      fieldId: ind.fieldId || '',
      functionId: ind.functionId || '',
      applicableDimensions: ind.applicableDimensions || [],
      timeDimension: ind.timeDimension || '',
    }
  }
}

function isLeafCatalog(id: string): boolean {
  const find = (nodes: AssetCatalogNode[]): boolean | null => {
    for (const n of nodes) {
      if (n.id === id) return !n.children || n.children.length === 0
      if (n.children) {
        const found = find(n.children)
        if (found !== null) return found
      }
    }
    return null
  }
  return find(assetCatalog) === true
}

function getCatalogPath(id: string): string[] | null {
  const find = (nodes: AssetCatalogNode[], path: string[] = []): string[] | null => {
    for (const n of nodes) {
      const p = [...path, n.id]
      if (n.id === id) return p
      if (n.children) {
        const found = find(n.children, p)
        if (found) return found
      }
    }
    return null
  }
  return find(assetCatalog)
}

onMounted(() => {
  form.value.bizOwner = form.value.bizOwner || currentUser.id
  form.value.techOwner = form.value.techOwner || currentUser.id
  if (isEdit.value) {
    loadIndicator()
  } else {
    const catalogFromRoute = route.query.catalog as string | undefined
    if (catalogFromRoute && isLeafCatalog(catalogFromRoute)) {
      const path = getCatalogPath(catalogFromRoute)
      if (path) form.value.assetCatalog = path
    }
  }
})

watch(
  () => form.value.modelId,
  () => {
    form.value.fieldId = ''
    form.value.functionId = ''
    form.value.applicableDimensions = []
    form.value.timeDimension = ''
  }
)

watch(
  () => form.value.subjectList,
  () => {
    formRef.value?.validateField('subject')
  },
  { deep: true }
)
</script>

<style scoped>
.atomic-indicator-form {
  max-width: 800px;
}
.page-title {
  font-size: 18px;
  margin-bottom: 24px;
}
.form-content {
  margin-bottom: 24px;
}
.expression-wrapper {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  padding: 16px;
  background: #fafafa;
}

.expression-layout {
  display: flex;
  gap: 0;
  width: 100%;
}

.expr-panel {
  padding: 0 12px;
  border: none;
  background: transparent;
}

.expr-panel:not(:last-child) {
  border-right: 1px solid #e4e7ed;
}

.func-panel {
  width: 25%;
  min-width: 160px;
}

.field-panel {
  width: 25%;
  min-width: 160px;
}

.formula-panel {
  flex: 1;
  min-width: 200px;
}

.func-combined-input {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.func-combined-input:hover,
.func-combined-input:focus-within {
  border-color: #409eff;
}

.func-category-select {
  width: 100px;
  flex-shrink: 0;
}

.func-category-select :deep(.el-input__wrapper) {
  box-shadow: none;
  border-radius: 0;
  border-right: 1px solid #e4e7ed;
}

.func-search-input {
  flex: 1;
  min-width: 0;
}

.func-search-input :deep(.el-input__wrapper) {
  box-shadow: none;
  border-radius: 0;
}

.func-search-input :deep(.el-input__prefix) {
  left: 8px;
}

.field-search-input {
  margin-bottom: 8px;
}

.formula-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.formula-header .required::after {
  content: '*';
  color: #f56c6c;
  margin-left: 2px;
}

.formula-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}
.expr-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 6px;
}
.func-tooltip {
  max-width: 280px;
  font-size: 12px;
  line-height: 1.6;
}
.panel-title {
  font-size: 14px;
  margin-bottom: 8px;
}
.func-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.func-item {
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.func-item:hover {
  background: #f5f7fa;
}

.field-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.func-tag {
  cursor: pointer;
}
.form-actions {
  padding-top: 24px;
  border-top: 1px solid #eee;
}
.model-dialog-content {
  display: flex;
  gap: 24px;
}
.model-list {
  flex: 1;
}
.model-detail {
  width: 280px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 16px;
}
.detail-content ul {
  margin: 8px 0 0 20px;
  padding: 0;
}
.catalog-select-input {
  cursor: pointer;
}
.catalog-tree-dropdown {
  max-height: 280px;
  overflow-y: auto;
}
.catalog-tree {
  border: none;
  padding: 0;
}
.catalog-tree :deep(.el-tree-node.is-disabled > .el-tree-node__content) {
  color: #c0c4cc;
  cursor: not-allowed;
}

</style>
