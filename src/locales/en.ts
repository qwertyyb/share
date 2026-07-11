export default {
  app: {
    title: 'Share',
  },
  faceToFaceConnect: {
    title: 'Face to face connect',
    description: 'Both parties need to enter the same connection code and grant location permission to establish a connection.',
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
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
  linkType: {
    direct: 'Direct',
    relay: 'Relay',
    unknown: 'Detecting',
  },
  localPeer: {
    title: 'My information',
    showQrCode: 'Show QR code',
    copy: 'Copy to clipboard',
    scanToConnect: 'Scan to connect',
  },
  connectOtherPeer: {
    title: 'Connect',
  },
  toast: {
    connectionTimeout: 'Connection timed out',
    copySuccess: '✅ Copied!',
    copyFailed: '❌ Copy failed',
    faceToFaceLookupFailed: 'Face to face connection failed',
    getLocationFailed: 'Get location failed',
    cannotConnectToSelf: 'Cannot connect to yourself',
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
