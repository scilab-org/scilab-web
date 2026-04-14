const REFRESH_TOKEN_KEY = 'hdl_refresh_token';

let _accessToken: string | null = null;

export const tokenStore = {
  getAccessToken: (): string | null => _accessToken,

  setAccessToken: (token: string | null): void => {
    _accessToken = token;
  },

  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setRefreshToken: (token: string | null): void => {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  clear: (): void => {
    _accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
