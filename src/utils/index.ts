export const formatSize = (size: number) => {
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

export type LinkType = 'direct' | 'relay' | 'unknown'

export const detectLinkType = async (pc: RTCPeerConnection): Promise<LinkType> => {
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

