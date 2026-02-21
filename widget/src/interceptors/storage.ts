export interface StorageSnapshot {
  localStorage: Record<string, string>
  sessionStorage: Record<string, string>
  cookies: string
}

let snapshot: StorageSnapshot = { localStorage: {}, sessionStorage: {}, cookies: '' }

export function captureStorage(): StorageSnapshot {
  const ls: Record<string, string> = {}
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)!
    ls[k] = window.localStorage.getItem(k) ?? ''
  }
  const ss: Record<string, string> = {}
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i)!
    ss[k] = window.sessionStorage.getItem(k) ?? ''
  }
  snapshot = { localStorage: ls, sessionStorage: ss, cookies: document.cookie }
  return snapshot
}

export function getStorageSnapshot(): StorageSnapshot { return snapshot }
