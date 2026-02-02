import * as React from 'react';

import { Comment, User } from '@/types/api';

import { useUser } from './auth';

// User Groups (what Keycloak calls groups)
export enum GROUPS {
  PROJECT_AUTHOR = 'project:author',
  PROJECT_PUBLISHER = 'project:publisher',
  PROJECT_CONTRIBUTOR = 'project:contributor',
}

export type GroupTypes = keyof typeof GROUPS;

// Helper to check if user has any of the specified groups
export const hasGroup = (
  userGroups: string[],
  ...allowedGroups: GroupTypes[]
): boolean => {
  return allowedGroups.some((g) => userGroups.includes(GROUPS[g]));
};

// User Roles/Permissions (what Keycloak provides as roles - specific permissions)
export const ROLES = {
  'comment:delete': (user: User, comment: Comment) => {
    // Publishers and authors can delete their own comments
    if (
      (user.groups.includes(GROUPS.PROJECT_PUBLISHER) ||
        user.groups.includes(GROUPS.PROJECT_AUTHOR)) &&
      comment.author?.id === user.id
    ) {
      return true;
    }

    // Check if user has specific role permission
    if (user.roles.includes('comment:delete')) {
      return true;
    }

    return false;
  },
};

export const useAuthorization = () => {
  const user = useUser();

  if (!user.data) {
    throw Error('User does not exist!');
  }

  const checkAccess = React.useCallback(
    ({ allowedGroups }: { allowedGroups: GROUPS[] }) => {
      if (allowedGroups && allowedGroups.length > 0 && user.data) {
        return allowedGroups.some((g) => user.data?.groups.includes(g));
      }

      return true;
    },
    [user.data],
  );

  const hasRole = React.useCallback(
    (role: string) => {
      return user.data?.roles.includes(role) || false;
    },
    [user.data],
  );

  return {
    checkAccess,
    hasRole,
    groups: user.data.groups,
    roles: user.data.roles,
  };
};

type AuthorizationProps = {
  forbiddenFallback?: React.ReactNode;
  children: React.ReactNode;
} & (
  | {
      allowedGroups: GROUPS[];
      policyCheck?: never;
    }
  | {
      allowedGroups?: never;
      policyCheck: boolean;
    }
);

export const Authorization = ({
  policyCheck,
  allowedGroups,
  forbiddenFallback = null,
  children,
}: AuthorizationProps) => {
  const { checkAccess } = useAuthorization();

  let canAccess = false;

  if (allowedGroups) {
    canAccess = checkAccess({ allowedGroups });
  }

  if (typeof policyCheck !== 'undefined') {
    canAccess = policyCheck;
  }

  return <>{canAccess ? children : forbiddenFallback}</>;
};
