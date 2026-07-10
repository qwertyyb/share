export default {
  app: {
    title: 'Share',
  },
  action: {
    start: '開始',
    connect: '接続',
    stop: '停止',
    send: '送信',
    selectFile: 'ファイルを選択',
  },
  placeholder: {
    peerId: '相手の Peer ID を入力',
    message: '送信する内容を入力…',
  },
  device: {
    list: 'デバイス一覧',
    empty: '接続中のデバイスはありません',
  },
  message: {
    empty: 'メッセージはありません',
    new: '新着メッセージ',
  },
  status: {
    connecting: '接続中',
    connected: '接続済み',
    disconnected: '切断済み',
  },
  linkType: {
    direct: '直接接続',
    relay: 'リレー',
    unknown: '検出中',
  },
  localPeer: {
    showQrCode: 'QRコードを表示',
    copy: 'クリップボードにコピー',
    scanToConnect: 'スキャンして接続',
  },
  toast: {
    connectionTimeout: '接続がタイムアウトしました',
    copySuccess: '✅ コピーしました',
    copyFailed: '❌ コピーに失敗しました',
  },
  footer: {
    githubRepo: 'GitHub リポジトリ',
    language: '言語',
  },
  language: {
    en: 'English',
    ja: '日本語',
    'zh-CN': '简体中文',
  },
} as const
