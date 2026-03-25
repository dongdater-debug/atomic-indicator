<template>
  <el-config-provider :locale="zhCn">
    <div class="app-layout">
      <!-- 顶部导航 -->
      <header class="top-header">
        <div class="platform-brand">
          <div class="platform-logo">FD</div>
          <div class="platform-text">
            <div class="platform-name">富途数据平台</div>
            <div class="platform-name-en">FutuData</div>
          </div>
        </div>
        <nav class="top-nav">
          <a
            v-for="item in topNavItems"
            :key="item.path"
            :class="['nav-item', { active: activeTopNav === item.path }]"
            @click="handleTopNavClick(item.path)"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            {{ item.label }}
          </a>
        </nav>
      </header>

      <div class="body-wrapper">
        <!-- 左侧导航（数据资产模块） -->
        <aside v-if="showSidebar" class="sidebar">
          <el-menu
            :default-active="activeMenu"
            :default-openeds="defaultOpeneds"
            router
            background-color="#ffffff"
            text-color="#333333"
            active-text-color="#1890ff"
            class="sidebar-menu"
          >
            <el-menu-item index="/tag-assets" disabled>
              <el-icon class="sidebar-icon"><PriceTag /></el-icon>
              <span>标签资产</span>
            </el-menu-item>
            <el-menu-item index="/event-assets" disabled>
              <el-icon class="sidebar-icon"><Calendar /></el-icon>
              <span>事件资产</span>
            </el-menu-item>
            <el-sub-menu index="indicator-asset">
              <template #title>
                <el-icon class="sidebar-icon"><DataAnalysis /></el-icon>
                <span>指标资产</span>
              </template>
              <el-menu-item index="/indicator-models" disabled>指标模型</el-menu-item>
              <el-sub-menu index="indicator-component">
                <template #title>指标元件</template>
                <el-menu-item index="/atomic-indicators">原子指标</el-menu-item>
                <el-menu-item index="/modifiers" disabled>修饰词</el-menu-item>
                <el-menu-item index="/time-periods">时间周期</el-menu-item>
              </el-sub-menu>
              <el-menu-item index="/derived-indicators" disabled>派生指标</el-menu-item>
              <el-menu-item index="/dimensions" disabled>维度管理</el-menu-item>
            </el-sub-menu>
            <el-menu-item index="/table-assets" disabled>
              <el-icon class="sidebar-icon"><Grid /></el-icon>
              <span>数据表资产</span>
            </el-menu-item>
          </el-menu>
        </aside>

        <main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import {
  HomeFilled,
  Monitor,
  DataAnalysis,
  Edit,
  Operation,
  Setting,
  PriceTag,
  Calendar,
  Grid,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const topNavItems = [
  { path: '/home', label: '首页', icon: HomeFilled },
  { path: '/data-apps', label: '数据应用', icon: Monitor },
  { path: '/data-assets', label: '数据资产', icon: DataAnalysis },
  { path: '/data-dev', label: '数据开发', icon: Edit },
  { path: '/data-governance', label: '数据治理', icon: Operation },
  { path: '/system', label: '系统管理', icon: Setting },
]

const activeTopNav = computed(() => {
  const path = route.path
  const dataAssetPaths = ['/atomic-indicators', '/time-periods', '/modifiers', '/derived-indicators', '/dimensions', '/indicator-models', '/base-indicators']
  if (dataAssetPaths.some((p) => path.startsWith(p))) return '/data-assets'
  return '/data-assets'
})

const showSidebar = computed(() => activeTopNav.value === '/data-assets')

const activeMenu = computed(() => route.path)

const defaultOpeneds = ['indicator-asset', 'indicator-component']

function handleTopNavClick(path: string) {
  if (path === '/data-assets') {
    router.push('/atomic-indicators')
  }
  // 其他模块暂无内容，暂不跳转
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
}

.platform-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 48px;
}

.platform-logo {
  width: 32px;
  height: 32px;
  background: #0052d9;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  flex-shrink: 0;
}

.platform-text {
  flex: 0 0 auto;
}

.platform-name {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  line-height: 1.3;
}

.platform-name-en {
  font-size: 11px;
  color: #8c8c8c;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.nav-icon {
  margin-right: 6px;
  font-size: 16px;
  vertical-align: middle;
}

.top-nav {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 14px;
  color: #333333;
  text-decoration: none;
  cursor: pointer;
  line-height: 56px;
}

.nav-item:hover {
  color: #1890ff;
}

.nav-item.active {
  color: #1890ff;
  font-weight: 500;
}

.body-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  color: #1890ff;
  font-weight: 500;
}

.sidebar-menu :deep(.el-menu-item.is-disabled) {
  color: #333333;
  opacity: 1;
}

.sidebar-icon {
  margin-right: 8px;
  font-size: 18px;
  vertical-align: middle;
}

.sidebar-menu :deep(.el-sub-menu__title) .sidebar-icon {
  margin-right: 8px;
}

.sidebar-menu :deep(.el-sub-menu__title:hover),
.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  background: #f0f2f5;
  padding: 24px;
  overflow: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 可操作字体不加粗 */
.el-link.el-link--primary,
.el-button.is-link {
  font-weight: 400;
}

/* 全局弹窗：标题、内容、操作区用分割线分隔 */
.el-dialog__header {
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 0;
  padding-bottom: 20px;
}
.el-dialog__body {
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 0;
  padding-bottom: 12px;
}
.el-dialog__body p {
  text-indent: 2em;
}
.el-dialog__footer {
  padding-top: 12px;
}
</style>
