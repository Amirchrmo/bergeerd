/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The Go API, e.g. http://localhost:8080/api or https://bergeerd.ir/api. */
  readonly VITE_API_URL: string;
  /** The public website; leave empty when it is served from the same origin. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
