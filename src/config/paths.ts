export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
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
    projectPaperWorkspace: {
      path: 'projects/details/:projectId/papers/:paperId/workspace',
      getHref: (projectId: string, paperId: string) =>
        `/app/projects/details/${projectId}/papers/${paperId}/workspace`,
    },
    projectPaperCombineEditor: {
      path: 'projects/details/:projectId/papers/:paperId/combine/:combineId',
      getHref: (projectId: string, paperId: string, combineId: string) =>
        `/app/projects/details/${projectId}/papers/${paperId}/combine/${combineId}`,
    },
    profile: {
      path: 'profile',
      getHref: () => '/app/profile',
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
      paperTemplate: {
        path: 'paper-templates/:templateId',
        getHref: (templateId: string) => `/app/paper-templates/${templateId}`,
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
      paperWorkspace: {
        path: 'my-projects/:projectId/papers/:paperId/workspace',
        getHref: (projectId: string, paperId: string) =>
          `/app/my-projects/${projectId}/papers/${paperId}/workspace`,
      },
      paperCombineEditor: {
        path: 'my-projects/:projectId/papers/:paperId/combine/:combineId',
        getHref: (projectId: string, paperId: string, combineId: string) =>
          `/app/my-projects/${projectId}/papers/${paperId}/combine/${combineId}`,
      },
    },
    myTasks: {
      path: 'my-tasks',
      getHref: () => '/app/my-tasks',
    },
    aiResearch: {
      path: 'my-projects/:projectId/ai-research',
      getHref: (projectId: string) =>
        `/app/my-projects/${projectId}/ai-research`,
    },
  },
} as const;
