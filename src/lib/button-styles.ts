/**
 * Shared button color styles for consistent UI across all pages.
 * Import and use with className on Button components.
 *
 * Usage:
 *   import { BTN } from '@/lib/button-styles';
 *   <Button className={BTN.CREATE}>Create</Button>
 */

/** Green — for create / add / new actions */
const CREATE = 'btn-create';

/** Blue — for edit / update / save actions */
const EDIT = 'btn-edit';

/** Blue outline — for edit trigger / outline buttons */
const EDIT_OUTLINE = 'btn-edit-outline';

/** Red — for delete / destructive actions */
const DANGER = 'btn-danger';

/** Red outline — for soft delete / destructive outline buttons */
const DANGER_OUTLINE = 'btn-danger-outline';

/** Purple — for auto-tag / AI / smart action buttons */
const AUTO_TAG = 'btn-auto-tag';

/** Slate / grey — for cancel / dismiss / secondary actions */
const CANCEL = 'btn-cancel';

/** Indigo outline — for view / navigate actions */
const VIEW_OUTLINE = 'btn-view-outline';

/** Emerald — for confirm / success actions */
const SUCCESS = 'btn-success';

/** Amber / warning outline */
const WARNING_OUTLINE = 'btn-warning-outline';

/** Amber / warning filled */
const WARNING = 'btn-warning';

export const BTN = {
  CREATE,
  EDIT,
  EDIT_OUTLINE,
  DANGER,
  DANGER_OUTLINE,
  AUTO_TAG,
  CANCEL,
  VIEW_OUTLINE,
  SUCCESS,
  WARNING_OUTLINE,
  WARNING,
} as const;
