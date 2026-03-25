<template>
  <div class="layout">
    <el-breadcrumb v-if="breadcrumb.length" separator="/" class="breadcrumb">
      <el-breadcrumb-item v-for="(item, i) in breadcrumb" :key="i">
        {{ item }}
      </el-breadcrumb-item>
    </el-breadcrumb>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const breadcrumb = computed(() => (route.meta.breadcrumb as string[]) || [])
</script>

<style scoped>
.layout {
  background: #fff;
  border-radius: 4px;
  padding: 24px;
  min-height: calc(100vh - 48px);
}
.breadcrumb {
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
