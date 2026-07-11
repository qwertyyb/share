<template>
  <div class="remote-peer-list">
    <ul class="remote-list" v-if="remotes.length">
      <li class="remote-item"
        v-for="(item, index) in remotes"
        :key="index"
        :class="{disabled: item.status === 'disconnected', selected: selectedConnection?.connection.peer === item.connection.peer}"
        @click="$emit('select', item)"
      >
        <p class="remote-info">
          {{ item.connection.peer }}
          <span class="connection-status" :class="item.status">{{ t(`status.${item.status}`) }}</span>
          <span class="link-type" :class="item.linkType" v-if="item.status === 'connected'">{{ t(`linkType.${item.linkType}`) }}</span>
        </p>
      </li>
    </ul>
    <div class="empty-list" v-else>{{ t('device.empty') }}</div>
  </div>
</template>

<script setup lang="ts">
import type { DataConnection } from 'peerjs';
import { useI18n } from 'vue-i18n';
import type { LinkType } from '@/utils';

const { t } = useI18n()

type RemoteItem = {
  connection: DataConnection,
  status: 'connecting' | 'connected' | 'disconnected',
  linkType: LinkType,
  info?: string
}

defineProps<{
  remotes: RemoteItem[]
  selectedConnection?: RemoteItem | null
}>()

defineEmits<{
  select: [RemoteItem]
}>()
</script>

<style lang="scss" scoped>
.remote-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  .remote-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: var(--border-radius);
    cursor: pointer;
    &.disabled {
      opacity: 0.6;
    }
    &.selected {
      background: var(--selected-bg-color);
    }
    .remote-info {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1;
    }
  }
  .remote-item + .remote-item {
    border-top: 1px solid var(--border-color);
  }
}
.empty-list {
  opacity: 0.4;
  text-align: center;
  margin: auto;
}
</style>