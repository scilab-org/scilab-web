import { env } from '@/config/env';

import { tokenStore } from './token-store';

const TOKEN_URL = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
const LOGOUT_URL = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/logout`;

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
};

async function postForm(
  url: string,
  params: Record<string, string>,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: env.KEYCLOAK_CLIENT_ID,
    ...params,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error_description?: string }).error_description ??
        'Authentication failed.',
    );
  }

  return res.json() as Promise<TokenResponse>;
}

export const authService = {
  async login(username: string, password: string): Promise<void> {
    const data = await postForm(TOKEN_URL, {
      grant_type: 'password',
      username,
      password,
    });
    tokenStore.setAccessToken(data.access_token);
    tokenStore.setRefreshToken(data.refresh_token);
  },

  async refresh(): Promise<boolean> {
    const rt = tokenStore.getRefreshToken();
    if (!rt) return false;

    try {
      const data = await postForm(TOKEN_URL, {
        grant_type: 'refresh_token',
        refresh_token: rt,
      });
      tokenStore.setAccessToken(data.access_token);
      tokenStore.setRefreshToken(data.refresh_token);
      return true;
    } catch {
      tokenStore.clear();
      return false;
    }
  },

  logout(): void {
    const rt = tokenStore.getRefreshToken();
    tokenStore.clear();

    if (rt) {
      postForm(LOGOUT_URL, { refresh_token: rt }).catch(() => {});
    }
  },
};
