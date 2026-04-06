/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Полный origin бэкенда, если фронт не через Vite proxy (например прод за своим доменом) */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
