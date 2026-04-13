import Keycloak from 'keycloak-js';

import { env } from '@/config/env';

// Initialize Keycloak instance
export const keycloak = new Keycloak({
  url: env.KEYCLOAK_URL,
  realm: env.KEYCLOAK_REALM,
  clientId: env.KEYCLOAK_CLIENT_ID,
});

// Keycloak initialization options
export const keycloakInitOptions = {
  onLoad: 'check-sso' as const,
  silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  checkLoginIframe: false,
  pkceMethod: 'S256' as const,
};
