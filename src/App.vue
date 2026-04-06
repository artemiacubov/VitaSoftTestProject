<script setup lang="ts">
import AdminPanel from '@/pages/AdminPanel.vue'
import { isAuthenticated } from '@/service/auth'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showAdminPanel = ref(false)

const checkAdminPanelVisibility = () => {
  showAdminPanel.value = isAuthenticated() && route.name !== 'Login'
}

watch(() => route.name, () => {
  checkAdminPanelVisibility()
}, { immediate: true })
</script>

<template>
  <router-view />
  <AdminPanel v-if="showAdminPanel" />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Commissioner:wght@300;400;500;600;700;800&display=swap');

* {
  padding: 0;
  box-sizing: border-box;
}

body, html, #app {
  font-family: 'Commissioner', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background: #fafafa;
  font-weight: 450;
  font-size: 14px;
  line-height: 1.5;
}

div, span, p, h1, h2, h3, h4, button, input, textarea, select, a, li, ul, ol {
  font-family: 'Commissioner', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
</style>