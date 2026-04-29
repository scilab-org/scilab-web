const REFRESH_TOKEN_KEY = 'hdl_refresh_token';

let _accessToken: string | null = null;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const tokenStore = {
  getAccessToken: (): string | null => _accessToken,

  setAccessToken: (token: string | null): void => {
    _accessToken = token;
    emitChange();
  },

  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setRefreshToken: (token: string | null): void => {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    emitChange();
  },

  clear: (): void => {
    _accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    emitChange();
  },

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
