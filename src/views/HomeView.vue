<template>
  <div class="home-view">
    <h1>P2P Share</h1>
    <button class="btn start-btn" @click="start" v-if="status === 'default' || status === 'connecting'">
      <MaterialIcon name="progress_activity" class="loading-icon" v-if="status === 'connecting'" />
      开始
    </button>
    <template v-if="status === 'connected'">
      <div class="local-info">
        <div class="local-peer-id">
          <input id="local-peer-id-content" :value="state.peerId" readonly />
          <button class="btn qrcode-btn" title="显示二维码" ref="qrcodeTrigger" @click="qrcodeVisible=true"><MaterialIcon name="qr_code" class="qrcode-icon" /></button>
          <button class="btn copy-btn" data-clipboard-target="#local-peer-id-content" title="复制到剪切板"><MaterialIcon name="content_copy" class="qrcode-icon" /></button>
        </div>
        <button class="btn close-btn" @click="stop">停止</button>
      </div>
      <div class="connect-other">
        <input type="text" class="other-peer-id-content" v-model="connectForm.peerId" placeholder="请输入对方PeerID">
        <!-- <button class="btn qrcode-btn" title="通过扫描二维码连接"><span class="material-symbols-outlined qrcode-icon">qr_code_scanner</span></button> -->
        <button class="btn connect-btn" @click="connect">连接</button>
      </div>
      <div class="card" v-if="remotes.length > 1">
        <div class="card-header">
          <h3 class="card-title">设备列表</h3>
        </div>
        <div class="card-body">
          <ul class="remote-list" v-if="remotes.length">
            <li class="remote-item"
              v-for="(item, index) in remotes"
              :key="index"
              :class="{disabled: item.status === 'disconnected', selected: selectedConnection === item.connection}"
              @click="selectedConnection = item.connection"
            >
              <p class="remote-info">
                {{ item.connection.peer }}
                <span class="connection-status" :class="item.status">{{ statusLabel(item.status) }}</span>
                <span class="link-type" :class="item.linkType" v-if="item.status === 'connected'">{{ linkTypeLabel(item.linkType) }}</span>
              </p>
            </li>
          </ul>
          <div class="empty-list" v-else>暂无已连接的设备</div>
        </div>
      </div>
      <div class="card send-section" v-if="selectedConnection">
        <div class="card-header">
          <h3 class="card-title">{{ selectedConnection.peer }}</h3>
          <p class="card-subtitle">
            <span>{{ selectedConnection.metadata?.title }}</span>
            <span class="connection-status" :class="selectedRemoteStatus" v-if="selectedRemoteStatus">{{ statusLabel(selectedRemoteStatus) }}</span>
            <span class="link-type" :class="selectedLinkType" v-if="selectedRemoteStatus === 'connected' && selectedLinkType">{{ linkTypeLabel(selectedLinkType) }}</span>
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
            <div class="empty-list" v-else>暂无消息</div>
          </div>
          <div class="input-area">
            <textarea v-model="sendForm.text" placeholder="输入要发送的内容" class="send-textarea"></textarea>
            <div class="btns">
              <button class="btn select-file-btn" @click="selectFile">
                <MaterialIcon name="attach_file" class="file-icon" />
                选择文件
              </button>
              <button class="btn send-btn" @click="send">
                发送
                <MaterialIcon name="send" class="send-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
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
        <h5 class="scan-tip">扫码连接</h5>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import Peer, { type DataConnection } from 'peerjs'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import ClipboardJS from 'clipboard'
import QRCode from 'qrcode'
import { UAParser } from 'ua-parser-js'
import { useFloating, offset, shift, arrow } from '@floating-ui/vue';
import { onClickOutside } from '@vueuse/core'

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:coturn.qwertyyb.cn:3478", username: "qwertyyb", credential: "860af5a1974747f89b79584c4afcdcd9" },
  { urls: "turn:coturn.qwertyyb.cn:3478?transport=tcp", username: "qwertyyb", credential: "860af5a1974747f89b79584c4afcdcd9" },
]

const connectForm = ref({ peerId: new URL(location.href).searchParams.get('peerId') || '' })
const sendForm = ref({ text: '' })
const selectedConnection = shallowRef<DataConnection | null>()
const messages = ref<Record<string, {
  role: 'me' | 'other',
  content: { type: 'text', text: string } | { type: 'file', fileName: string, fileType: string, fileSize: number, file: File }
}[]>>({})

const selectedMessages = computed(() => {
  return selectedConnection.value ? messages.value[selectedConnection.value.peer] || [] : []
})

const formatSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const status = ref<'default' | 'connecting' | 'connected'>('default')
const state = ref({
  peerId: ''
})
type LinkType = 'direct' | 'relay' | 'unknown'
type RemoteItem = {
  connection: DataConnection,
  status: 'connecting' | 'connected' | 'disconnected',
  linkType: LinkType,
  info?: string
}

const linkTypeLabel = (type: LinkType) => {
  if (type === 'direct') return '直连'
  if (type === 'relay') return '中继'
  return '检测中'
}

const statusLabel = (status: RemoteItem['status']) => {
  if (status === 'connecting') return '连接中'
  if (status === 'connected') return '已连接'
  return '已断开'
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

const detectLinkType = async (pc: RTCPeerConnection): Promise<LinkType> => {
  try {
    const stats = await pc.getStats()
    let localType: string | undefined
    let remoteType: string | undefined

    stats.forEach((report) => {
      if (report.type === 'transport' && 'selectedCandidatePairId' in report && report.selectedCandidatePairId) {
        const pair = stats.get(report.selectedCandidatePairId as string)
        if (pair && 'localCandidateId' in pair && 'remoteCandidateId' in pair) {
          const local = stats.get(pair.localCandidateId as string)
          const remote = stats.get(pair.remoteCandidateId as string)
          if (local && 'candidateType' in local) localType = local.candidateType as string
          if (remote && 'candidateType' in remote) remoteType = remote.candidateType as string
        }
      }
      if (report.type === 'candidate-pair' && 'state' in report && report.state === 'succeeded') {
        if ('localCandidateId' in report && report.localCandidateId) {
          const local = stats.get(report.localCandidateId as string)
          if (local && 'candidateType' in local) localType = local.candidateType as string
        }
        if ('remoteCandidateId' in report && report.remoteCandidateId) {
          const remote = stats.get(report.remoteCandidateId as string)
          if (remote && 'candidateType' in remote) remoteType = remote.candidateType as string
        }
      }
    })

    if (localType === 'relay' || remoteType === 'relay') return 'relay'
    if (localType || remoteType) return 'direct'
    return 'unknown'
  } catch {
    return 'unknown'
  }
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
  return remotes.value.find(item => item.connection === selectedConnection.value)?.linkType ?? null
})

const selectedRemoteStatus = computed(() => {
  if (!selectedConnection.value) return null
  return remotes.value.find(item => item.connection === selectedConnection.value)?.status ?? null
})
const remotes = shallowRef<RemoteItem[]>([])
const qrcode = ref('')
const qrcodeVisible = ref(false)
let peer: Peer | null = null

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
    const url = new URL(location.href)
    url.searchParams.set('peerId', id)
    qrcode.value = await QRCode.toDataURL(url.toString(), {
      margin: 0
    })
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
        showToast('连接超时')
      }
    }, CONNECT_TIMEOUT_MS)
  }

  dataConnection.on('open', () => {
    clearTimers()
    console.warn('dataConnection onOpen', dataConnection)
    if (!selectedConnection.value) {
      selectedConnection.value = dataConnection
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
    update({ info: '新消息' })
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
    metadata: { title }
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
      selectedConnection.value!.send(data)
      addMessage(selectedConnection.value!.peer, 'me', data)
    })
  })
  input.click()
}

const send = () => {
  if (!selectedConnection.value || !sendForm.value.text) return;
  const data = { type: 'text', text: sendForm.value.text } as const
  selectedConnection.value?.send(data)
  addMessage(selectedConnection.value.peer, 'me', data)
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

let clipboard: ClipboardJS
onMounted(() => {
  clipboard = new ClipboardJS('.copy-btn')
  clipboard.on('success', () => {
    alert('复制成功！')
  })
  clipboard.on('error', () => {
    alert('！！！复制失败！！！')
  })

  if (connectForm.value.peerId) {
    createPeer()
  }
})

onBeforeUnmount(() => {
  clipboard.destroy()
})

</script>

<style lang="scss" scoped>
:global(:root) {
  --border-color: #e5e5e5;
  --hover-bg-color: #bbbb;
  --selected-bg-color: #ccc;
  --border-radius: 2px;
}
.home-view {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
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

h1 {
  text-align: center;
  margin-bottom: 16px;
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

@keyframes rotation {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg);}
}

.start-btn {
  display: flex;
  align-items: center;
  margin: auto;
  .loading-icon {
    font-size: 16px;
    margin-right: 4px;
    animation: rotation 2s linear both infinite;
  }
}

.local-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.close-btn {
  margin-left: 8px;
  border-radius: var(--border-radius);
  background: rgb(192, 0, 0);
  color: #fff;
  &:hover {
    background: rgb(141, 0, 0);
  }
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
  }
  .qrcode-btn {
    width: 42px;
  }
  .qrcode-icon {
    font-size: 18px;
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
