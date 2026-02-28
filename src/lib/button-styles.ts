/**
 * Shared button color styles for consistent UI across all pages.
 * Import and use with className on Button components.
 *
 * Usage:
 *   import { BTN } from '@/lib/button-styles';
 *   <Button className={BTN.CREATE}>Create</Button>
 */

/** Green — for create / add / new actions */
const CREATE =
  'bg-green-600 text-white shadow-sm shadow-green-200 hover:bg-green-700 dark:bg-green-700 dark:shadow-green-900/30 dark:hover:bg-green-600';

/** Blue — for edit / update / save actions */
const EDIT =
  'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 dark:bg-blue-700 dark:shadow-blue-900/30 dark:hover:bg-blue-600';

/** Blue outline — for edit trigger / outline buttons */
const EDIT_OUTLINE =
  'border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30';

/** Red — for delete / destructive actions */
const DANGER =
  'bg-red-600 text-white shadow-sm shadow-red-200 hover:bg-red-700 dark:bg-red-700 dark:shadow-red-900/30 dark:hover:bg-red-600';

/** Red outline — for soft delete / destructive outline buttons */
const DANGER_OUTLINE =
  'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30';

/** Purple — for auto-tag / AI / smart action buttons */
const AUTO_TAG =
  'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50';

/** Slate / grey — for cancel / dismiss / secondary actions */
const CANCEL =
  'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800';

/** Indigo outline — for view / navigate actions */
const VIEW_OUTLINE =
  'border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30';

/** Emerald — for confirm / success actions */
const SUCCESS =
  'bg-emerald-600 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 dark:bg-emerald-700 dark:shadow-emerald-900/30 dark:hover:bg-emerald-600';

/** Amber / warning outline */
const WARNING_OUTLINE =
  'border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30';

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
} as const;
