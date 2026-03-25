import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import List from './List.vue'
import Layout from '@/views/Layout.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [{ path: 'atomic-indicators', component: List }],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function createWrapper() {
  return mount(List, {
    global: {
      plugins: [ElementPlus, router],
    },
  })
}

describe('AtomicIndicator List', () => {
  beforeEach(async () => {
    await router.push('/atomic-indicators')
  })

  it('renders filter section', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.filter-section').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="请输入指标中英文搜索"]').exists()).toBe(true)
  })

  it('renders create button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('新建原子指标')
  })

  it('renders batch operation dropdown', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('批量操作')
  })

  it('batch operation button exists in action section', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    const actionSection = wrapper.find('.action-section')
    expect(actionSection.text()).toContain('批量操作')
  })
})
