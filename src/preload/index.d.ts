import type { GrokDesktopAPI } from './index'

declare global {
  interface Window {
    grok: GrokDesktopAPI
  }
}

export {}
