<template>
  <div class="local-info">
    <div class="local-peer-id">
      <input id="local-peer-id-content" :value="peerId" readonly />
      <button class="btn qrcode-btn" :title="t('localPeer.showQrCode')" ref="qrcodeTrigger" @click="qrcodeVisible=true"><MaterialIcon name="qr_code" class="qrcode-icon" /></button>
      <button class="btn copy-btn" :data-clipboard-text="peerId" :title="t('localPeer.copy')"><MaterialIcon name="content_copy" class="qrcode-icon" /></button>
    </div>
    <button class="btn danger-btn" @click="$emit('stop')">{{ t('action.stop') }}</button>
    <div class="qrcode-popover"
      :style="floatingStyles"
      v-if="qrcodeVisible"
      ref="qrcodePopover">
      <div class="arrow"
        ref="qrcodePopoverArrow"
        :style="{
          position: 'absolute',
          left:
            middlewareData.arrow?.x != null
              ? `${middlewareData.arrow.x}px`
              : '',
          top:
            middlewareData.arrow?.y != null
              ? `${middlewareData.arrow.y}px`
              : '',
        }"
      >
      </div>
      <img :src="qrcode" alt="" class="qrcode">
      <h5 class="scan-tip">{{ t('localPeer.scanToConnect') }}</h5>
    </div>
  </div>
</template>

<script setup lang="ts">
import { arrow, offset, shift, useFloating } from '@floating-ui/vue';
import { onClickOutside } from '@vueuse/core';
import { ref, useTemplateRef, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import MaterialIcon from '@/components/MaterialIcon.vue'
import QRCode from 'qrcode'

const { t } = useI18n()


const props = defineProps<{ peerId: string }>()
defineEmits<{ stop: [] }>()

const qrcode = ref('')
const qrcodeVisible = ref(false)

const qrcodeTrigger = useTemplateRef('qrcodeTrigger')
const qrcodePopover = useTemplateRef('qrcodePopover')
const qrcodePopoverArrow = useTemplateRef('qrcodePopoverArrow')

const { floatingStyles, middlewareData } = useFloating(qrcodeTrigger, qrcodePopover, {
  placement: 'bottom',
  middleware: [offset(12), shift({ padding: 12 }), arrow({ element: qrcodePopoverArrow, padding: 6 })]
});

onClickOutside(qrcodePopover, () => {
  qrcodeVisible.value = false
})

watchEffect(async () => {
  const url = new URL(location.href)
  url.searchParams.set('peerId', props.peerId)
  qrcode.value = await QRCode.toDataURL(url.toString(), {
    margin: 0
  })
})

</script>

<style lang="scss" scoped>
.local-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.local-peer-id {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  flex: 1;
  #local-peer-id-content {
    flex: 1;
    height: 32px;
    border: none;
    outline: none;
    font-size: 14px;
    padding-inline: 8px;
    width: 100px;
  }
  .qrcode-btn {
    width: 42px;
  }
  .qrcode-icon {
    font-size: 18px;
  }
}

.qrcode-popover {
  // border: 1px solid var(--border-color);
  position: relative;
  background: #fff;
  text-align: center;
  padding: 16px 16px 8px 16px;
  filter: drop-shadow(0px 3px 10px #bbb);
  .scan-tip {
    margin-top: 8px;
  }
  .qrcode {
    max-width: 300px;
  }
  .arrow {
    position: absolute;
    top: -7px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid #fff;
  }
}
</style>
