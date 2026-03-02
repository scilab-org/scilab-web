const SERVICE_PREFIX = '/lab-service';

export const PAPER_TEMPLATE_MANAGEMENT_API = {
  PAPER_TEMPLATES: `${SERVICE_PREFIX}/paper-templates`,
  PAPER_TEMPLATE_BY_ID: (id: string) =>
    `${SERVICE_PREFIX}/paper-templates/${id}`,
  ADMIN_PAPER_TEMPLATES: `${SERVICE_PREFIX}/admin/paper-templates`,
  ADMIN_PAPER_TEMPLATE_BY_ID: (id: string) =>
    `${SERVICE_PREFIX}/admin/paper-templates/${id}`,
} as const;

export const PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS = {
  PAPER_TEMPLATES: 'paper-templates',
  PAPER_TEMPLATE: 'paper-template',
} as const;
