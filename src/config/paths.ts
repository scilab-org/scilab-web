export const paths = {
  home: {
    path: '/',
    getHref: () => '/app',
  },
  app: {
    root: {
      path: '/app',
      getHref: () => '/app',
    },
    dashboard: {
      path: '',
      getHref: () => '/app',
    },
    sample: {
      path: 'sample',
      getHref: () => '/app/sample',
    },
    projects: {
      path: 'projects',
      getHref: () => '/app/projects',
    },
    projectDetail: {
      path: 'projects/details/:projectId',
      getHref: (projectId: string) => `/app/projects/details/${projectId}`,
    },
    settings: {
      path: 'settings',
      getHref: () => '/app/settings',
    },
    userManagement: {
      users: {
        path: 'users',
        getHref: () => '/app/users',
      },
      user: {
        path: 'users/:userId',
        getHref: (userId: string) => `/app/users/${userId}`,
      },
    },
    groupRoleManagement: {
      groups: {
        path: 'groups',
        getHref: () => '/app/groups',
      },
      group: {
        path: 'groups/:groupId',
        getHref: (groupId: string) => `/app/groups/${groupId}`,
      },
    },
    paperManagement: {
      papers: {
        path: 'papers',
        getHref: () => '/app/papers',
      },
      paper: {
        path: 'papers/:paperId',
        getHref: (paperId: string) => `/app/papers/${paperId}`,
      },
    },
    tagManagement: {
      tags: {
        path: 'tags',
        getHref: () => '/app/tags',
      },
    },
  },
} as const;
