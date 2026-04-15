import * as React from 'react';

import { User } from '@/types/api';

import { authService } from './auth-service';
import { tokenStore } from './token-store';

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

const SYSTEM_ROLES = [
  'offline_access',
  'uma_authorization',
  'manage-account',
  'manage-account-links',
  'view-profile',
];

export function jwtToUser(token: string): User {
  const p = decodeJwt(token);

  const groups = ((p.groups as string[]) ?? []).map((g) =>
    g.startsWith('/') ? g.slice(1) : g,
  );

  const realmRoles =
    (p.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const resourceRoles = Object.values(
    (p.resource_access as Record<string, { roles?: string[] }> | undefined) ??
      {},
  ).flatMap((r) => r.roles ?? []);

  const roles = [...new Set([...realmRoles, ...resourceRoles])].filter(
    (r) => !SYSTEM_ROLES.includes(r) && !r.startsWith('default-roles-'),
  );

  return {
    id: (p.sub as string) ?? '',
    email: (p.email as string) ?? '',
    emailVerified: p.email_verified as boolean | undefined,
    name: p.name as string | undefined,
    preferredUsername: p.preferred_username as string | undefined,
    firstName: p.given_name as string | undefined,
    lastName: p.family_name as string | undefined,
    groups,
    roles,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export const useAuthContext = (): AuthContextValue => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Restore session from stored refresh token on mount
  React.useEffect(() => {
    authService.refresh().then((refreshed) => {
      if (refreshed) {
        const token = tokenStore.getAccessToken();
        if (token) setUser(jwtToUser(token));
      }
      setIsLoading(false);
    });
  }, []);

  const login = React.useCallback(
    async (username: string, password: string) => {
      await authService.login(username, password);
      const token = tokenStore.getAccessToken()!;
      setUser(jwtToUser(token));
    },
    [],
  );

  const logout = React.useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
