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
  --default-btn-text-color: #000;
  --default-btn-bg-color: #ddd;
  --disabled-bg-color: #f5f5f5;
  color-scheme: light dark;
}

input, textarea {
  background: none;
}

@media (prefers-color-scheme: dark) {
  :root {
    --border-color: #333;
    --default-btn-text-color: #000;
    --default-btn-bg-color: #cdcdcd;
    --selected-bg-color: #333;
    --disabled-bg-color: #333;
  }
};

// common
.btn {
  border: none;
  outline: none;
  background-color: var(--default-btn-bg-color);
  transition: background-color .2s;
  padding: 6px 12px;
  height: 36px;
  box-sizing: border-box;
  border-radius: var(--border-radius);
  color: var(--default-btn-text-color);
  & + & {
    border-left: 1px solid var(--border-color);
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  &[disabled] {
    background-color: var(--disabled-bg-color);
    color: #999;
    cursor: not-allowed;
  }
  @media (any-hover: hover) {
    &:not([disabled]):hover {
      background-color: #bbb;
    }
  }

  &.danger-btn {
    margin-left: 8px;
    border-radius: var(--border-radius);
    background: rgb(192, 0, 0);
    color: #fff;
    @media (any-hover: hover) {
      &:hover {
        background: rgb(141, 0, 0);
      }
    }
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
