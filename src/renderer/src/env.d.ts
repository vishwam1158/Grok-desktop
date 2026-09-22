/// <reference types="vite/client" />
/// <reference types="../../preload/index.d.ts" />

declare module '*.png' {
  const src: string
  export default src
}
