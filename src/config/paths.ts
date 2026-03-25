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
    projectPaperDetail: {
      path: 'projects/details/:projectId/papers/:paperId',
      getHref: (projectId: string, paperId: string) =>
        `/app/projects/details/${projectId}/papers/${paperId}`,
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
      writingPaper: {
        path: 'writing-papers/:paperId',
        getHref: (paperId: string) => `/app/writing-papers/${paperId}`,
      },
    },
    tagManagement: {
      tags: {
        path: 'tags',
        getHref: () => '/app/tags',
      },
    },
    journalManagement: {
      journals: {
        path: 'journals',
        getHref: () => '/app/journals',
      },
      journal: {
        path: 'journals/:journalId',
        getHref: (journalId: string) => `/app/journals/${journalId}`,
      },
    },
    paperTemplateManagement: {
      paperTemplates: {
        path: 'paper-templates',
        getHref: () => '/app/paper-templates',
      },
    },
    assignedProjects: {
      list: {
        path: 'my-projects',
        getHref: () => '/app/my-projects',
      },
      detail: {
        path: 'my-projects/:projectId',
        getHref: (projectId: string) => `/app/my-projects/${projectId}`,
      },
      paperDetail: {
        path: 'my-projects/:projectId/papers/:paperId',
        getHref: (projectId: string, paperId: string) =>
          `/app/my-projects/${projectId}/papers/${paperId}`,
      },
    },
    myTasks: {
      path: 'my-tasks',
      getHref: () => '/app/my-tasks',
    },
  },
} as const;
