import { useKeycloak } from '@react-keycloak/web';
import * as React from 'react';
import { Navigate, useLocation } from 'react-router';

import { keycloak } from '@/config/keycloak';
import { paths } from '@/config/paths';
import { User } from '@/types/api';

/**
 * Get the current access token
 */
export const getToken = (): string | undefined => {
  return keycloak.token;
};

/**
 * Get the refresh token
 */
export const getRefreshToken = (): string | undefined => {
  return keycloak.refreshToken;
};

/**
 * Get the ID token
 */
export const getIdToken = (): string | undefined => {
  return keycloak.idToken;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return keycloak.authenticated || false;
};

/**
 * Get user profile from Keycloak
 */
export const getUserProfile = async () => {
  try {
    return await keycloak.loadUserProfile();
  } catch (error) {
    console.error('Failed to load user profile', error);
    return null;
  }
};

/**
 * Update the token if it's about to expire
 * @param minValidity - Minimum validity in seconds (default: 5)
 */
export const updateToken = async (
  minValidity: number = 5,
): Promise<boolean> => {
  try {
    return await keycloak.updateToken(minValidity);
  } catch (error) {
    console.error('Failed to refresh token', error);
    return false;
  }
};

/**
 * Check if user has a specific role
 * @param role - Role name to check
 */
export const hasRole = (role: string): boolean => {
  return keycloak.hasRealmRole(role) || keycloak.hasResourceRole(role);
};

/**
 * Check if user has any of the specified roles
 * @param roles - Array of role names
 */
export const hasAnyRole = (roles: string[]): boolean => {
  return roles.some((role) => hasRole(role));
};

/**
 * Check if user has all of the specified roles
 * @param roles - Array of role names
 */
export const hasAllRoles = (roles: string[]): boolean => {
  return roles.every((role) => hasRole(role));
};

/**
 * Get all user roles (both realm and resource roles), filtered to remove Keycloak defaults
 */
export const getUserRoles = (): string[] => {
  const realmRoles = keycloak.realmAccess?.roles || [];
  const resourceRoles = Object.values(keycloak.resourceAccess || {}).flatMap(
    (resource) => resource.roles || [],
  );

  // Filter out Keycloak default/system roles
  const defaultRoles = [
    'offline_access',
    'uma_authorization',
    'manage-account',
    'manage-account-links',
    'view-profile',
  ];
  const defaultRolePatterns = [/^default-roles-/];

  return [...new Set([...realmRoles, ...resourceRoles])].filter(
    (role) =>
      !defaultRoles.includes(role) &&
      !defaultRolePatterns.some((pattern) => pattern.test(role)),
  );
};

/**
 * Get all user groups, with leading slashes removed
 */
export const getUserGroups = (): string[] => {
  const tokenParsed = keycloak.tokenParsed;
  if (!tokenParsed) return [];

  const keycloakGroups = tokenParsed.groups || [];
  return keycloakGroups.map((g: string) =>
    g.startsWith('/') ? g.substring(1) : g,
  );
};

/**
 * Get the account management URL
 */
export const getAccountUrl = (): string => {
  return keycloak.createAccountUrl();
};

/**
 * Redirect to account management
 */
export const goToAccount = (): void => {
  window.location.href = getAccountUrl();
};

/**
 * Get the token parsed payload
 */
export const getTokenParsed = () => {
  return keycloak.tokenParsed;
};

/**
 * Get user info from token
 */
export const getUserInfo = () => {
  const tokenParsed = keycloak.tokenParsed;
  if (!tokenParsed) return null;

  return {
    sub: tokenParsed.sub,
    email: tokenParsed.email,
    emailVerified: tokenParsed.email_verified,
    name: tokenParsed.name,
    preferredUsername: tokenParsed.preferred_username,
    givenName: tokenParsed.given_name,
    familyName: tokenParsed.family_name,
  };
};

/**
 * Login to Keycloak
 */
export const login = () => {
  keycloak.login({ redirectUri: `${window.location.origin}/dashboard` });
};

/**
 * Logout from Keycloak
 */
export const logout = () => {
  keycloak.logout();
};

/**
 * Hook to get current user from Keycloak (always fresh data)
 * Maps Keycloak token claims to User type
 */
export const useUser = () => {
  const { keycloak, initialized } = useKeycloak();

  const user: User | null = React.useMemo(() => {
    if (!initialized || !keycloak.authenticated || !keycloak.tokenParsed) {
      return null;
    }

    const userInfo = getUserInfo();

    return {
      id: userInfo?.sub || '',
      email: userInfo?.email || '',
      emailVerified: userInfo?.emailVerified,
      name: userInfo?.name,
      preferredUsername: userInfo?.preferredUsername,
      firstName: userInfo?.givenName,
      lastName: userInfo?.familyName,
      groups: getUserGroups(),
      roles: getUserRoles(),
    };
  }, [initialized, keycloak.authenticated, keycloak.tokenParsed]);

  return {
    data: user,
    isLoading: !initialized,
    error: null,
  };
};

/**
 * Login hook (follows react-query-auth pattern)
 */
export const useLogin = () => {
  return {
    mutate: login,
    mutateAsync: async () => {
      login();
    },
  };
};

/**
 * Logout hook (follows react-query-auth pattern)
 */
export const useLogout = () => {
  return {
    mutate: logout,
    mutateAsync: async () => {
      logout();
    },
  };
};

/**
 * Auth loader component - shows loading state while Keycloak initializes
 */
export const AuthLoader = ({ children }: { children: React.ReactNode }) => {
  const { initialized } = useKeycloak();

  if (!initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Protected route component
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to={paths.home.getHref()} state={{ from: location }} replace />
    );
  }

  return <>{children}</>;
};
