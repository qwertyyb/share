import { onMounted, onBeforeUnmount } from "vue"
import ClipboardJS from 'clipboard'
import { showToast } from "@/utils"
import { useI18n } from "vue-i18n"

export const useClipboard = (selector: string = '[data-clipboard-text]') => {
  const { t } = useI18n()

  let clipboard: ClipboardJS | undefined

  onMounted(() => {
    clipboard = new ClipboardJS(selector)
    clipboard.on('error', () => {
      showToast(t('toast.copyFailed'))
    })
    clipboard.on('success', () => {
      showToast(t('toast.copySuccess'))
    })
  })

  onBeforeUnmount(() => {
    clipboard?.destroy()
    clipboard = undefined
  })

  return clipboard
}