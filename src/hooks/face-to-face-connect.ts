import { checkHealth, lookup } from "@/services"
import { showToast } from "@/utils"
import { onBeforeUnmount, onMounted, ref, unref, type ComputedRef, type MaybeRef } from "vue"
import { useI18n } from "vue-i18n"

const HEARTBEAT_INTERVAL = 2 * 1000

export const useFaceToFaceConnect = (peerId: MaybeRef<string> | ComputedRef<string>, connect: (peerId: string) => void) => {
  const enabled = ref(false)
  const running = ref(false)
  const code = ref('')

  const { t } = useI18n()

  let heartbeatInterval: ReturnType<typeof setTimeout> | undefined
  const faceToFaceConnectsTime = new Map<string, number>()

  const startHeartbeat = async (location: { lat: number, lng: number }) => {
    const peers = await lookup({ peerId: unref(peerId), code: code.value, lat: location.lat, lng: location.lng }).catch(err => {
      showToast(`${t('toast.faceToFaceLookupFailed')}: ${err instanceof Error ? err.message : String(err)}`)
      throw err;
    })
    peers.forEach(item => {
      // 拿到的 peers 可能已经过期了，所以需要根据 updatedAt 判断是否需要重新连接
      const lastUpdatedAt = faceToFaceConnectsTime.get(item.peerId)
      if (lastUpdatedAt === item.updatedAt) {
        return
      }
      faceToFaceConnectsTime.set(item.peerId, item.updatedAt)
      connect(item.peerId)
    })
    heartbeatInterval = setTimeout(startHeartbeat, HEARTBEAT_INTERVAL, location)
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearTimeout(heartbeatInterval)
      heartbeatInterval = undefined
    }
  }

  const getLocation = async () => {
    let location: GeolocationPosition | undefined
    try {
      location = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }))
    } catch (error) {
      showToast(`${t('toast.getLocationFailed')}: ${(error as Error).message}`)
      throw error
    }
    return { lat: location?.coords.latitude ?? 0, lng: location?.coords.longitude ?? 0 }
  }

  const start = async () => {
    if (!code.value) return
    const location = await getLocation()
    console.log('location', location)
    running.value = true
    startHeartbeat(location)
  }

  const stop = () => {
    stopHeartbeat()
    running.value = false
    faceToFaceConnectsTime.clear()
  }

  onMounted(() => {
    checkHealth().then(health => {
      enabled.value = health
    })
  })

  onBeforeUnmount(() => {
    stop()
  })

  return { enabled, running, code, start, stop }
}