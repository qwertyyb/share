<script setup lang="ts">
import AppFooter from './components/AppFooter.vue'
import HomeView from './views/HomeView.vue';
</script>

<template>
  <div class="app-layout">
    <main class="app-main">
      <HomeView />
    </main>
    <AppFooter />
  </div>
</template>

<style>
* {
  padding: 0;
  margin: 0;
}
html, body, #app {
  height: 100%;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.app-main {
  flex: 1;
}
</style>
