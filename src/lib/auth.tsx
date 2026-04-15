import * as React from 'react';
import { Navigate } from 'react-router';
import { Loader2 } from 'lucide-react';

import { paths } from '@/config/paths';
import { useAuthContext } from '@/features/auth/auth-context';
import { tokenStore } from '@/features/auth/token-store';

// ─── Token accessors ──────────────────────────────────────────────────────────

export const getToken = (): string | null => tokenStore.getAccessToken();
export const getRefreshToken = (): string | null =>
  tokenStore.getRefreshToken();
export const isAuthenticated = (): boolean => !!tokenStore.getAccessToken();

// ─── Group helpers ────────────────────────────────────────────────────────────

export const getUserGroups = (): string[] => {
  const token = tokenStore.getAccessToken();
  if (!token) return [];
  try {
    const [, payload] = token.split('.');
    const p = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return ((p.groups as string[]) ?? []).map((g) =>
      g.startsWith('/') ? g.slice(1) : g,
    );
  } catch {
    return [];
  }
};

export const getUserRoles = (): string[] => {
  const token = tokenStore.getAccessToken();
  if (!token) return [];
  try {
    const [, payload] = token.split('.');
    const p = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const realmRoles =
      (p.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
    const resourceRoles = Object.values(
      (p.resource_access as Record<string, { roles?: string[] }> | undefined) ??
        {},
    ).flatMap((r) => r.roles ?? []);
    const systemRoles = [
      'offline_access',
      'uma_authorization',
      'manage-account',
      'manage-account-links',
      'view-profile',
    ];
    return [...new Set([...realmRoles, ...resourceRoles])].filter(
      (r) => !systemRoles.includes(r) && !r.startsWith('default-roles-'),
    );
  } catch {
    return [];
  }
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useUser = () => {
  const { user, isLoading } = useAuthContext();
  return { data: user, isLoading, error: null };
};

export const useLogout = () => {
  const { logout } = useAuthContext();
  return {
    mutate: logout,
    mutateAsync: async () => logout(),
  };
};

// ─── Route guards ─────────────────────────────────────────────────────────────

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-12 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={paths.auth.login.getHref()} replace />;
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Navigation helper — sign in is now handled via <Link to="/auth/login">
export const login = () => {};
