/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GLITCHTIP_DSN?: string;
  readonly VITE_RELEASE?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_UMAMI_SRC?: string;
  readonly VITE_DISTRIBUTION_CHANNEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
