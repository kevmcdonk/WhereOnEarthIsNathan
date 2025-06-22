/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_AZURE_CLIENT_ID: string;
  readonly PUBLIC_AZURE_TENANT_ID: string;
  readonly PUBLIC_REDIRECT_URI: string;
  readonly PUBLIC_API_ENDPOINT: string;
  readonly PUBLIC_API_SCOPES: string;
  readonly PUBLIC_ORCHESTRATOR_AGENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
