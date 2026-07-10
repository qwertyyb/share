<template>
  <div class="home-view">
    <h1>{{ t('app.title') }}</h1>
    <button class="btn start-btn" @click="start" v-if="status === 'default' || status === 'connecting'">
      <MaterialIcon name="progress_activity" class="loading-icon" v-if="status === 'connecting'" />
      {{ t('action.start') }}
    </button>
    <template v-if="status === 'connected'">
      <LocalPeerInfo :peer-id="state.peerId" @stop="stop" />
      <div class="connect-other">
        <input type="text" class="other-peer-id-content" v-model="connectForm.peerId" :placeholder="t('placeholder.peerId')">
        <button class="btn connect-btn" @click="connect">{{ t('action.connect') }}</button>
      </div>
      <div class="card" v-if="remotes.length > 1">
        <div class="card-header">
          <h3 class="card-title">{{ t('device.list') }}</h3>
        </div>
        <div class="card-body">
          <RemotePeerList
            :remotes="remotes"
            :selected-connection="selectedConnection"
            @select="selectedConnection = $event"
          />
        </div>
      </div>
      <div class="card send-section" v-if="selectedConnection">
        <div class="card-header">
          <h3 class="card-title">{{ selectedConnection.connection.peer }}</h3>
          <p class="card-subtitle">
            <span>{{ selectedConnection.connection.metadata?.title }}</span>
            <span class="connection-status" :class="selectedRemoteStatus" v-if="selectedRemoteStatus">{{ t(`status.${selectedRemoteStatus}`) }}</span>
            <span class="link-type" :class="selectedLinkType" v-if="selectedRemoteStatus === 'connected' && selectedLinkType">{{ t(`linkType.${selectedLinkType}`) }}</span>
          </p>
        </div>
        <div class="card-body">
          <div class="messages-area">
            <ul class="message-list" v-if="selectedMessages.length">
              <li class="message-item"
                v-for="(message, index) in selectedMessages"
                :key="index"
                :class="message.role"
              >
                <div class="message-content-text" v-if="message.content.type === 'text'">{{ message.content.text }}</div>
                <div class="message-content-file" v-else>
                  <div class="file-thumbnail-wrapper">
                    <MaterialIcon name="draft" class="file-thumbnail-icon" />
                  </div>
                  <div class="file-info">
                    <div class="file-name">{{ message.content.fileName }}</div>
                    <div class="file-size">{{ formatSize(message.content.file.size) }}</div>
                  </div>
                  <div class="file-download">
                    <MaterialIcon name="download_2" @click="download(message.content)" />
                  </div>
                </div>
              </li>
            </ul>
            <div class="empty-list" v-else>{{ t('message.empty') }}</div>
          </div>
          <div class="input-area">
            <textarea v-model="sendForm.text" :placeholder="t('placeholder.message')" class="send-textarea"></textarea>
            <div class="btns">
              <button class="btn select-file-btn" @click="selectFile">
                <MaterialIcon name="attach_file" class="file-icon" />
                {{ t('action.selectFile') }}
              </button>
              <button class="btn send-btn" @click="send">
                {{ t('action.send') }}
                <MaterialIcon name="send" class="send-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import LocalPeerInfo from '@/components/LocalPeerInfo.vue'
import RemotePeerList from '@/components/RemotePeerList.vue'
import Peer, { type DataConnection } from 'peerjs'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { UAParser } from 'ua-parser-js'
import { detectLinkType, formatSize, type LinkType } from '@/utils'

const { t } = useI18n()

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:coturn.qwertyyb.cn:3478", username: "qwertyyb", credential: "860af5a1974747f89b79584c4afcdcd9" },
  { urls: "turn:coturn.qwertyyb.cn:3478?transport=tcp", username: "qwertyyb", credential: "860af5a1974747f89b79584c4afcdcd9" },
]

const connectForm = ref({ peerId: new URL(location.href).searchParams.get('peerId') || '' })
const sendForm = ref({ text: '' })
const selectedConnection = shallowRef<RemoteItem | null>()
const messages = ref<Record<string, {
  role: 'me' | 'other',
  content: { type: 'text', text: string } | { type: 'file', fileName: string, fileType: string, fileSize: number, file: File }
}[]>>({})

const selectedMessages = computed(() => {
  return selectedConnection.value ? messages.value[selectedConnection.value.connection.peer] || [] : []
})

const status = ref<'default' | 'connecting' | 'connected'>('default')
const state = ref({
  peerId: ''
})
type RemoteItem = {
  connection: DataConnection,
  status: 'connecting' | 'connected' | 'disconnected',
  linkType: LinkType,
  info?: string
}

const CONNECT_TIMEOUT_MS = 20000
const ICE_DISCONNECT_GRACE_MS = 5000

const getRemoteStatus = (dataConnection: DataConnection) => {
  return remotes.value.find(item => item.connection === dataConnection)?.status
}

const markRemoteByConnection = (dataConnection: DataConnection, val: Partial<RemoteItem>) => {
  remotes.value = remotes.value.map(item => {
    if (item.connection === dataConnection) {
      return { ...item, ...val }
    }
    return item
  })
}

const markRemoteDisconnected = (dataConnection: DataConnection) => {
  markRemoteByConnection(dataConnection, { status: 'disconnected', info: '' })
}

const resetSession = () => {
  remotes.value = remotes.value.map(item => {
    if (item.status === 'connecting' || item.status === 'connected') {
      return { ...item, status: 'disconnected', info: '' }
    }
    return item
  })
  selectedConnection.value = null
  status.value = 'default'
  state.value.peerId = ''
}

const updateLinkType = async (dataConnection: DataConnection) => {
  const linkType = await detectLinkType(dataConnection.peerConnection)
  remotes.value = remotes.value.map(item => {
    if (item.connection === dataConnection) {
      return { ...item, linkType }
    }
    return item
  })
}

const selectedLinkType = computed(() => {
  if (!selectedConnection.value) return null
  return remotes.value.find(item => item.connection === selectedConnection.value?.connection)?.linkType ?? null
})

const selectedRemoteStatus = computed(() => {
  if (!selectedConnection.value) return null
  return remotes.value.find(item => item.connection === selectedConnection.value?.connection)?.status ?? null
})
const remotes = shallowRef<RemoteItem[]>([])
let peer: Peer | null = null

const addMessage = (peerId: string, role: 'me' | 'other', content: { type: 'text', text: string } | {
  type: 'file', fileName: string, file: File, fileType: string, fileSize: number,
}) => {
  if (!messages.value[peerId]) {
    messages.value[peerId] = []
  }
  messages.value[peerId].push({ role, content })
}

const showToast = (content: string) => {
  const toastEl = document.createElement('div')
  toastEl.classList.add('toast')
  toastEl.textContent = content
  document.body.append(toastEl)
  setTimeout(() => {
    toastEl.remove()
  }, 3000)
}

const createPeer = () => {
  status.value = 'connecting'
  if (peer) {
    peer.destroy()
  }
  peer = new Peer({
    config: {
      iceServers: ICE_SERVERS
    }
  })

  peer.on('close', () => {
    peer?.destroy()
    peer = null
  })

  peer.on('disconnected', (id) => {
    console.warn('disconnected', id)
    resetSession()
  })

  peer.on('connection', (dataConnection) => {
    console.log('dataConnection', dataConnection)
    initDataConnection(dataConnection)
  })

  peer.on('open', async (id) => {
    console.log('open', id)
    status.value = 'connected'
    state.value.peerId = id
    if (connectForm.value.peerId) {
      connect()
    }
  })

  peer.on('error', (err) => {
    console.error('error', err)
    showToast(err.message)
    if (err.type === 'peer-unavailable') {
      const peerId = err.message.match(/Could\snot\sconnect\sto\speer\s(\S+)/)?.[1]
      if (peerId) {
        remotes.value = remotes.value.map(item => {
          if (item.connection.peer === peerId && item.status === 'connecting') {
            return { ...item, status: 'disconnected', info: '' }
          }
          return item
        })
      }
      return
    }
  })
}

const start = () => {
  createPeer()
}

const stop = () => {
  peer?.destroy()
  peer = null
  resetSession()
  remotes.value = []
  selectedConnection.value = null
}

const initDataConnection = (dataConnection: DataConnection) => {
  const exists = remotes.value.some(i => i.connection === dataConnection)
  if (!exists) {
    remotes.value = [{ connection: dataConnection, status: dataConnection.open ? 'connected' : 'connecting', linkType: 'unknown' }, ...remotes.value]
  }
  const update = (val: Partial<RemoteItem>) => markRemoteByConnection(dataConnection, val)

  let connectTimer: ReturnType<typeof setTimeout> | undefined
  let iceDisconnectTimer: ReturnType<typeof setTimeout> | undefined

  const clearTimers = () => {
    if (connectTimer) clearTimeout(connectTimer)
    if (iceDisconnectTimer) clearTimeout(iceDisconnectTimer)
    connectTimer = undefined
    iceDisconnectTimer = undefined
  }

  if (!dataConnection.open) {
    connectTimer = setTimeout(() => {
      if (getRemoteStatus(dataConnection) === 'connecting') {
        markRemoteDisconnected(dataConnection)
        showToast(t('toast.connectionTimeout'))
      }
    }, CONNECT_TIMEOUT_MS)
  }

  dataConnection.on('open', () => {
    clearTimers()
    console.warn('dataConnection onOpen', dataConnection)
    if (!selectedConnection.value) {
      selectedConnection.value = remotes.value.find(item => item.connection === dataConnection) ?? null
    }
    update({ status: 'connected', info: '' })
    updateLinkType(dataConnection)
  })
  dataConnection.on('close', () => {
    clearTimers()
    console.warn('dataConnection onClose')
    markRemoteDisconnected(dataConnection)
  })
  dataConnection.on('error', (err) => {
    clearTimers()
    console.error('dataConnection onError', err)
    showToast(err.message)
    markRemoteDisconnected(dataConnection)
  })
  dataConnection.on('iceStateChanged', state => {
    console.debug('dataConnection onIceStateChanged', state)
    if (state === 'connected' || state === 'completed') {
      if (iceDisconnectTimer) {
        clearTimeout(iceDisconnectTimer)
        iceDisconnectTimer = undefined
      }
      updateLinkType(dataConnection)
      return
    }
    if (state === 'failed' || state === 'closed') {
      clearTimers()
      markRemoteDisconnected(dataConnection)
      return
    }
    if (state === 'disconnected' && !iceDisconnectTimer) {
      iceDisconnectTimer = setTimeout(() => {
        iceDisconnectTimer = undefined
        if (getRemoteStatus(dataConnection) === 'connected') {
          markRemoteByConnection(dataConnection, { status: 'disconnected', info: '' })
        }
      }, ICE_DISCONNECT_GRACE_MS)
    }
  })
  dataConnection.on('data', data => {
    console.info('dataConnection onData', data)
    update({ info: t('message.new') })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = data as any
    if (message.type === 'file' && message.fileName && message.fileType && message.file && message.file instanceof Uint8Array) {
      message.file = new File([message.file], message.fileName, { type: message.fileType })
    }
    addMessage(dataConnection.peer, 'other', message)
  })
}

const connect = () => {
  if (!connectForm.value.peerId) return
  const targetPeerId = connectForm.value.peerId
  remotes.value = remotes.value.map(item => {
    if (item.connection.peer === targetPeerId && item.status === 'connecting') {
      item.connection.close()
      return { ...item, status: 'disconnected', info: '' }
    }
    return item
  })
  const ua = UAParser(navigator.userAgent)
  const title = [ua.device, ua.os, ua.browser].join(' ')
  console.warn('连接', connectForm.value.peerId)
  const dataConnection = peer?.connect(connectForm.value.peerId, {
    metadata: { title },
    reliable: true
  })
  if (!dataConnection) {
    console.error('connect error')
    return
  }
  console.log('dataConnection', dataConnection)
  initDataConnection(dataConnection)
}

const selectFile = () => {
  if (!selectedConnection.value) return;
  const input = document.createElement('input')
  input.type = 'file'
  input.addEventListener('change', () => {
    if (!selectedConnection.value) return;
    Array.from(input.files || []).forEach(file => {
      const data = { type: 'file', fileName: file.name, file: file, fileSize: file.size, fileType: file.type } as const
      selectedConnection.value!.connection.send(data)
      addMessage(selectedConnection.value!.connection.peer, 'me', data)
    })
  })
  input.click()
}

const send = () => {
  if (!selectedConnection.value || !sendForm.value.text) return;
  const data = { type: 'text', text: sendForm.value.text } as const
  selectedConnection.value!.connection.send(data)
  addMessage(selectedConnection.value.connection.peer, 'me', data)
  sendForm.value.text = ''
}

const download = (message: { file: File }) => {
  const url = URL.createObjectURL(message.file);
  const a = document.createElement("a");
  a.href = url;
  a.download = message.file.name
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  if (connectForm.value.peerId) {
    createPeer()
  }
})
</script>

<style lang="scss" scoped>
.home-view {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

h1 {
  text-align: center;
  margin-bottom: 16px;
}

@keyframes rotation {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg);}
}

.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
  min-width: 120px;
  .loading-icon {
    font-size: 16px;
    margin-right: 4px;
    animation: rotation 2s linear both infinite;
  }
}

.connect-other {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  .other-peer-id-content {
    flex: 1;
    height: 32px;
    border: none;
    outline: none;
    font-size: 14px;
    padding-inline: 8px;
  }
  .qrcode-btn {
    width: 42px;
  }
  .qrcode-icon {
    font-size: 18px;
  }
}

.card {
  margin: 16px 0;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  .card-header {
    padding: 8px 16px;
    border-bottom: 1px solid var(--border-color);
    .card-subtitle {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 14px;
      opacity: 0.6;
      margin-top: 4px;
    }
  }
  .card-body {
    padding: 16px;
  }
}
.remote-list {
  list-style: none;
  padding: 0;
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
}

.send-section {
  .card-body {
    display: flex;
    flex-direction: column;
    padding: 0;
  }
  .messages-area {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 12px;
    min-height: 100px;
  }
  .message-list {
    list-style: none;
    max-height: 600px;
    overflow: auto;
    .message-item {
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      width: fit-content;
      padding: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      max-width: 80%;
      &.me {
        margin-left: auto;
      }
      .message-content-file {
        display: flex;
        align-items: center;
        .file-thumbnail-icon {
          font-size: 42px;
          opacity: 0.7;
        }
        .file-info {
          margin-left: 8px;
        }
        .file-name {
          margin-bottom: 4px;
          font-weight: 500;
        }
        .file-size {
          font-size: 12px;
          opacity: 0.4;
        }
        .file-download {
          margin-left: 16px;
          cursor: pointer;
          border-radius: 9999px;
          transition: background .2s;
          padding: 4px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          &:hover {
            background: var(--hover-bg-color);
          }
        }
      }
      .message-content-text {
        word-break: break-all;
      }
    }
  }
  .input-area {
    padding: 0 16px 16px 16px;
    display: flex;
    flex-direction: column;
  }
  .send-textarea {
    resize: none;
    width: 100%;
    height: 140px;
    border: none;
    box-sizing: border-box;
    outline: none;
  }
  .btns {
    width: 100%;
    display: flex;
    .btn {
      display: flex;
      align-items: center;
    }
  }
  .select-file-btn {
    border-radius: var(--border-radius);
  }
  .send-btn {
    margin-left: auto;
    border-radius: var(--border-radius);
    border-left: none;
    background: green;
    color: #fff;
    .send-icon {
      font-size: 20px;
      margin-left: 4px;
    }
  }
}

@keyframes slideDown {
  0% { opacity: 0; transform: translate(-50%, -100%) }
  8% { opacity: 1; transform: translate(-50%, 0) }
  92% { opacity: 1; transform: translate(-50%, 0) }
  100% { opacity: 0; transform: translate(-50%, 100%); }
}

:global(.toast) {
  position: fixed;
  bottom: 60px;
  pointer-events: none;
  background: #000;
  padding: 4px 12px;
  color: #fff;
  max-width: 90vw;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 6px 10px #999;
  border-radius: var(--border-radius);
  animation: slideDown 2.4s both;
}

</style>
