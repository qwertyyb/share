<script setup lang="ts">
import { computed } from 'vue'
import attachFile from '@material-symbols/svg-400/outlined/attach_file.svg?raw'
import contentCopy from '@material-symbols/svg-400/outlined/content_copy.svg?raw'
import download2 from '@material-symbols/svg-400/outlined/download_2.svg?raw'
import draft from '@material-symbols/svg-400/outlined/draft.svg?raw'
import progressActivity from '@material-symbols/svg-400/outlined/progress_activity.svg?raw'
import qrCode from '@material-symbols/svg-400/outlined/qr_code.svg?raw'
import menu from '@material-symbols/svg-400/outlined/menu.svg?raw'
import send from '@material-symbols/svg-400/outlined/send.svg?raw'

const icons = {
  attach_file: attachFile,
  content_copy: contentCopy,
  download_2: download2,
  draft,
  progress_activity: progressActivity,
  qr_code: qrCode,
  menu,
  send,
} as const

export type MaterialIconName = keyof typeof icons

const props = defineProps<{
  name: MaterialIconName
}>()

const svg = computed(() => icons[props.name])
</script>

<template>
  <span class="material-icon" aria-hidden="true" v-html="svg" />
</template>

<style scoped>
.material-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: middle;
}

.material-icon :deep(svg) {
  width: 1em;
  height: 1em;
  fill: currentColor;
}
</style>
