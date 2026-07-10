export default {
  app: {
    title: 'Share',
  },
  action: {
    start: 'Start',
    connect: 'Connect',
    stop: 'Stop',
    send: 'Send',
    selectFile: 'Select file',
  },
  placeholder: {
    peerId: 'Enter peer ID',
    message: 'Type a message…',
    faceToFaceConnectPlaceholder: 'Enter face to face connect code',
  },
  device: {
    list: 'Devices',
    empty: 'No connected devices',
  },
  message: {
    empty: 'No messages',
    new: 'New message',
  },
  status: {
    connecting: 'Connecting',
    connected: 'Connected',
    disconnected: 'Disconnected',
  },
  linkType: {
    direct: 'Direct',
    relay: 'Relay',
    unknown: 'Detecting',
  },
  localPeer: {
    showQrCode: 'Show QR code',
    copy: 'Copy to clipboard',
    scanToConnect: 'Scan to connect',
  },
  toast: {
    connectionTimeout: 'Connection timed out',
    copySuccess: '✅ Copied!',
    copyFailed: '❌ Copy failed',
  },
  footer: {
    githubRepo: 'GitHub repository',
    language: 'Language',
  },
  language: {
    en: 'English',
    ja: '日本語',
    'zh-CN': '简体中文',
  },
} as const
