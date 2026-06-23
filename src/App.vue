<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppFooter from './components/AppFooter.vue'
import HomeView from './views/HomeView.vue';

const { locale } = useI18n()

const syncDocumentLang = () => {
  document.documentElement.lang = locale.value
}

onMounted(syncDocumentLang)
watch(locale, syncDocumentLang)
</script>

<template>
  <div class="app-layout">
    <main class="app-main">
      <HomeView />
    </main>
    <AppFooter />
  </div>
</template>

<style lang="scss">
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

:root {
  --border-color: #e5e5e5;
  --hover-bg-color: #bbbb;
  --selected-bg-color: #ccc;
  --border-radius: 2px;
}

// common
.btn {
  border: none;
  outline: none;
  background-color: #ddd;
  transition: background-color .2s;
  padding: 6px 12px;
  height: 36px;
  box-sizing: border-box;
  border-radius: var(--border-radius);
  &:hover {
    background-color: #bbb;
  }
  & + & {
    border-left: 1px solid var(--border-color);
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}



.link-type {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.4;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  white-space: nowrap;
  &.direct {
    border-color: #2d8a2d;
    color: #2d8a2d;
  }
  &.relay {
    border-color: #b8860b;
    color: #b8860b;
  }
  &.unknown {
    opacity: 0.6;
  }
}

.connection-status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.4;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  white-space: nowrap;
  &.connecting {
    border-color: #b8860b;
    color: #b8860b;
  }
  &.connected {
    border-color: #2d8a2d;
    color: #2d8a2d;
  }
  &.disconnected {
    border-color: #999;
    color: #999;
  }
}
</style>
