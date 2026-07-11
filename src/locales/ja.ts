export default {
  app: {
    title: 'Share',
  },
  faceToFaceConnect: {
    title: '面対面接続',
    description: '面対面接続双方は同じ接続コードを入力し、位置情報の許可を与える必要があります。',
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
    faceToFaceConnectPlaceholder: '面対面接続コードを入力',
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
    enabled: '有効',
    disabled: '無効',
  },
  linkType: {
    direct: '直接接続',
    relay: 'リレー',
    unknown: '検出中',
  },
  localPeer: {
    title: '私の情報',
    showQrCode: 'QRコードを表示',
    copy: 'クリップボードにコピー',
    scanToConnect: 'スキャンして接続',
  },
  connectOtherPeer: {
    title: '接続',
  },
  toast: {
    connectionTimeout: '接続がタイムアウトしました',
    copySuccess: '✅ コピーしました',
    copyFailed: '❌ コピーに失敗しました',
    faceToFaceLookupFailed: '面対面接続に失敗しました',
    getLocationFailed: '位置情報の取得に失敗しました',
    cannotConnectToSelf: '自分自身に接続できません',
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
