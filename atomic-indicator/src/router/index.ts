import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/views/Layout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/atomic-indicators',
    children: [
      {
        path: 'atomic-indicators',
        name: 'AtomicIndicatorList',
        component: () => import('@/views/atomic-indicator/List.vue'),
        meta: { title: '原子指标列表', breadcrumb: ['指标资产', '指标元件'] },
      },
      {
        path: 'atomic-indicators/create',
        name: 'AtomicIndicatorCreate',
        component: () => import('@/views/atomic-indicator/Form.vue'),
        meta: { title: '新建原子指标', breadcrumb: ['指标资产', '指标元件', '新建'] },
      },
      {
        path: 'atomic-indicators/edit/:id',
        name: 'AtomicIndicatorEdit',
        component: () => import('@/views/atomic-indicator/Form.vue'),
        meta: { title: '编辑原子指标', breadcrumb: ['指标资产', '指标元件', '编辑'] },
      },
      {
        path: 'atomic-indicators/detail/:id',
        name: 'AtomicIndicatorDetail',
        component: () => import('@/views/atomic-indicator/Detail.vue'),
        meta: { title: '原子指标详情', breadcrumb: ['指标资产', '指标元件', '详情'] },
      },
      {
        path: 'base-indicators/detail/:id',
        name: 'BaseIndicatorDetail',
        component: () => import('@/views/base-indicator/Detail.vue'),
        meta: { title: '基础指标详情', breadcrumb: ['指标资产', '基础指标', '详情'] },
      },
      {
        path: 'time-periods',
        name: 'TimePeriodList',
        component: () => import('@/views/time-period/List.vue'),
        meta: { title: '时间周期列表', breadcrumb: ['指标资产', '指标元件'] },
      },
      {
        path: 'derived-indicators/detail/:id',
        name: 'DerivedIndicatorDetail',
        component: () => import('@/views/derived-indicator/Detail.vue'),
        meta: { title: '派生指标详情', breadcrumb: ['指标资产', '派生指标', '详情'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
