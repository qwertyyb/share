export default {
  app: {
    title: 'Share',
  },
  action: {
    start: '开始',
    connect: '连接',
    stop: '停止',
    send: '发送',
    selectFile: '选择文件',
  },
  placeholder: {
    peerId: '请输入对方 Peer ID',
    message: '输入要发送的内容',
    faceToFaceConnectPlaceholder: '请输入面对面连接码',
  },
  device: {
    list: '设备列表',
    empty: '暂无已连接的设备',
  },
  message: {
    empty: '暂无消息',
    new: '新消息',
  },
  status: {
    connecting: '连接中',
    connected: '已连接',
    disconnected: '已断开',
  },
  linkType: {
    direct: '直连',
    relay: '中继',
    unknown: '检测中',
  },
  localPeer: {
    showQrCode: '显示二维码',
    copy: '复制到剪切板',
    scanToConnect: '扫码连接',
  },
  toast: {
    connectionTimeout: '连接超时',
    copySuccess: '✅ 复制成功！',
    copyFailed: '❌ 复制失败',
  },
  footer: {
    githubRepo: 'GitHub 仓库',
    language: '语言',
  },
  language: {
    en: 'English',
    ja: '日本語',
    'zh-CN': '简体中文',
  },
} as const
