/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (swRegistration?: ServiceWorkerRegistration) => void
    onRegisterError?: (error?: any) => void
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}

declare module 'virtual:pwa-assets' {
  export interface PwaAssetsOptions {
    includeHtmlHead?: boolean
    includeManifestIconEntries?: boolean
  }

  export function generatePwaAssets(options?: PwaAssetsOptions): void
}
