# Front-End Code Style Guide

> Stack: React 19 · TypeScript 5 (strict) · Vite 6 · Tailwind CSS 4 · React Query v5 · React Router v7 · Radix UI · Zustand · Keycloak · Axios

### Hierarchy of Authority

Sections 1–18 define **implementation patterns** — how to structure code, fetch data, manage state, and compose components.

**Section 19 (HyperDataLab Design System) is the design authority.** It defines the visual identity: colors, typography, spacing, radius, elevation, and layout. When any earlier section's styling example conflicts with Section 19, Section 19 wins. Specifically:

- Semantic Tailwind tokens in `index.css` must map to the HyperDataLab design palette (Section 19.2).
- CVA variants are the **implementation layer** — their actual color values must conform to the design system rules.
- Layout components in `components/layouts/` implement the design system layout.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Naming](#2-naming)
3. [Components](#3-components)
4. [State — Zustand](#4-state--zustand)
5. [Routing](#5-routing)
6. [Styling](#6-styling)
7. [TypeScript](#7-typescript)
8. [Imports Order](#8-imports-order)
9. [Custom Hooks](#9-custom-hooks)
10. [Data Fetching](#10-data-fetching)
11. [Forms](#11-forms)
12. [UI Components](#12-ui-components)
13. [Route Components](#13-route-components)
14. [Authorization](#14-authorization)
15. [Animations](#15-animations)
16. [Error Handling](#16-error-handling)
17. [Commenting Rules](#17-commenting-rules)
18. [General Rules](#18-general-rules)
19. [Design System: HyperDataLab](#19-design-system-hyperdatalab)

---

## 1. Project Structure

```
src/
├── app/               # Shell: layout, routing, entry (router.tsx, routes/)
├── components/        # Shared UI (ui/, layouts/, errors/, seo/)
├── features/          # Domain modules (feature/api/, feature/components/, types.ts, constants.ts)
├── hooks/             # Custom hooks (barrel: hooks/index.ts)
├── lib/               # Core: api-client.ts, auth.tsx, authorization.tsx, react-query.ts, button-styles.ts
├── config/            # env.ts, paths.ts, keycloak.ts
├── types/             # Shared TS types (api.ts)
└── utils/             # Pure utility functions (no React): cn.ts, string-utils.ts
```

**Import boundaries:**

- `app/` imports from `features/` **only in route files** — route files are thin and compose from `features/`.
- `features/` imports from its own domain or from shared modules (`lib/`, `utils/`, `types/`, `components/`).
- Shared modules (`components/`, `lib/`, `utils/`, `types/`) export upward only — never import from `features/`.
- Use `@/` for all cross-module imports. Use relative imports only within the same feature folder.

---

## 2. Naming

| Entity            | Convention                    | Example                           |
| ----------------- | ----------------------------- | --------------------------------- |
| Files / folders   | kebab-case                    | `users-list.tsx`, `use-mobile.ts` |
| React components  | PascalCase                    | `UsersList`, `CreateUser`         |
| Hooks             | `use` prefix                  | `useUsers`, `useCreateUser`       |
| Stores            | `use` prefix + `Store` suffix | `useAppStore`                     |
| Store selectors   | `select` prefix               | `selectFilterPanelOpen`           |
| Props types       | `{Component}Props`            | `UpdateUserProps`                 |
| API functions     | camelCase verb                | `getUsers`, `createUser`          |
| Query options fn  | `get{X}QueryOptions`          | `getUsersQueryOptions`            |
| Types             | PascalCase                    | `UserDto`, `GetUsersParams`       |
| Zod schemas       | camelCase + `Schema` suffix   | `createUserSchema`                |
| Constants objects | UPPER_CASE                    | `USER_MANAGEMENT_API`             |
| Query keys object | UPPER_CASE                    | `USER_MANAGEMENT_QUERY_KEYS`      |
| Route params      | camelCase in `getHref`        | `getHref: (userId: string)`       |

---

## 3. Components

- **Functional only**, typed with `interface extends` for props that extend native HTML elements.
- **Named exports** in `components/` and `features/`. Default exports only for route lazy-loading.
- Use `cn()` for class merging. Use `data-slot` attributes on compound component parts.
- Destructure props with inline defaults.

### Component reuse rule

**Always check `src/components/ui/` and `src/components/` first** before implementing a new component inside a feature. If a component could be used by more than one feature, it belongs in `src/components/ui/`. Create shared components proactively — features should compose from shared primitives, not rebuild them.

Current shared components include: `Button`, `Dialog`, `AlertDialog`, `Input`, `Table`, `Badge`, `Card`, `Skeleton`, `FilterSelect`, `UserAvatar`, `Popover`, `Tooltip`, `Separator`, `Progress`, `Sheet`, `Sidebar`.

### Base Button (reference implementation)

The `<Button>` component uses CVA for structural variants. Located at `src/components/ui/button.tsx`.

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-semibold transition-all gap-2 outline-none shrink-0 disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-cta-hover text-primary-foreground uppercase tracking-wide hover:opacity-90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        action:
          'bg-surface-container text-on-surface font-mono uppercase tracking-wide hover:bg-foreground hover:text-background active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 text-sm has-[>svg]:px-3',
        xs: "h-6 px-2 text-xs gap-1 has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 px-3 text-sm gap-1.5 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 text-base has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

**Key patterns:**

- CVA `variant` controls the structural role (default, outline, ghost, destructive, action, secondary).
- `variant="action"` — mono uppercase with tonal surface fill, used for table row actions.
- `variant="secondary"` — CTA hover bg with uppercase tracking, used for primary form actions (Create, Save).
- Import `Slot` from `radix-ui` (not `@radix-ui/react-slot`), use `Slot.Root`.
- Loading state is handled inline: `disabled={mutation.isPending}` + conditional `{mutation.isPending ? <Loader /> : 'SAVE'}`.

### List components

Always handle three states in order: loading → empty → data.

```tsx
export const UsersList = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const page = +(searchParams.get('page') || 1);
  const searchText = searchParams.get('search') || undefined;
  const groupName = searchParams.get('groupName') || undefined;
  const enabled = searchParams.get('enabled') || undefined;

  const usersQuery = useUsers({
    params: { pageNumber: page, pageSize: 10, searchText, groupName, enabled },
  });

  // 1. Loading
  if (usersQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // 2. Empty
  const users = usersQuery.data?.result?.items;
  if (!users || users.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground text-sm">
          {searchText || groupName || enabled
            ? 'No users match your search criteria.'
            : 'No users found.'}
        </p>
      </div>
    );
  }

  // 3. Data — table + pagination
  const paging = usersQuery.data?.result?.paging;
  return (
    <div>
      <Table>{/* ... */}</Table>
      {paging && (/* pagination */)}
    </div>
  );
};
```

### Table usage

Tables use the shared `Table` component set from `components/ui/table.tsx`. Do **not** use `@tanstack/react-table` or any third-party table library — tables are composed declaratively with the Shadcn-style primitives.

#### Component composition

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
```

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Username</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Roles</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id} className="border-0">
        <TableCell>{/* primary identifier with avatar + link */}</TableCell>
        <TableCell className="text-muted-foreground font-mono text-sm">
          {user.email}
        </TableCell>
        <TableCell>{/* status dot indicator */}</TableCell>
        <TableCell>
          <Badge variant="admin">Admin</Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <UpdateUser user={user} userId={user.id!} />
            <DeactivateUser userId={user.id!} />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Built-in styling (inherited from the `Table` primitives)

These styles are baked into the shared `table.tsx` component — do not override them in feature code:

- **`TableHead`**: `text-on-surface-variant px-6 py-4 font-mono text-xs font-semibold tracking-widest uppercase` — small uppercase column headers.
- **`TableRow`**: `bg-surface-container-low hover:bg-surface-container border-0 transition-colors` — tonal background shift on hover.
- **`TableCell`**: `border-foreground/10 border-b px-6 py-6` — generous padding, subtle bottom border.
- **`TableHeader`**: `[&_tr]:bg-surface-container` — header row has an elevated surface tone.

#### Column patterns

| Column type        | Cell styling                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Primary identifier | Link with `hover:underline`, bold text, optional `<UserAvatar>` — prefetch detail on hover                    |
| Metadata (email)   | `text-muted-foreground font-mono text-sm`                                                                     |
| Name               | `text-foreground text-sm` with `capitalize()` helper from `@/utils/string-utils`                              |
| Status indicator   | Dot (`size-2 shrink-0 rounded-full` + color) + small uppercase label (`font-mono text-[10px] tracking-wider`) |
| Role / tag         | `<Badge variant="admin">` or `<Badge variant="user">` — use semantic badge variants                           |
| Actions (last col) | `<TableHead className="text-right">` + `<TableCell className="text-right">` with `flex justify-end gap-2`     |

#### Row link with prefetch

For navigable rows, wrap the primary cell content in a `<Link>` and prefetch the detail query on hover:

```tsx
<TableCell>
  <Link
    to={paths.app.userManagement.user.getHref(user.id!)}
    className="flex items-center gap-3 underline-offset-2 hover:underline"
    onMouseEnter={() => {
      queryClient.prefetchQuery(getUserQueryOptions(user.id!));
    }}
  >
    <UserAvatar
      avatarUrl={user.avatarUrl}
      firstName={user.firstName}
      username={user.username}
      size="sm"
    />
    <span className="text-foreground text-base font-semibold">
      {user.username}
    </span>
  </Link>
</TableCell>
```

#### Pagination

Place pagination below the table inside the same wrapping `<div>`. Use `<Link>` for page navigation (not `onClick` handlers) so pages are URL-addressable.

```tsx
const buildPageUrl = (page: number, currentParams: URLSearchParams) => {
  const params = new URLSearchParams(currentParams);
  params.set('page', page.toString());
  return `?${params.toString()}`;
};
```

```tsx
{
  paging && (
    <div className="border-border/40 flex items-center justify-between px-6 py-4">
      <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-widest">
        Showing {rangeStart}–{rangeEnd} of {paging.totalCount} entries
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!paging.hasPreviousPage}
          asChild={paging.hasPreviousPage}
        >
          {paging.hasPreviousPage ? (
            <Link to={buildPageUrl(paging.pageNumber - 1, searchParams)}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span>
              <ChevronLeft className="size-4" />
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!paging.hasNextPage}
          asChild={paging.hasNextPage}
        >
          {paging.hasNextPage ? (
            <Link to={buildPageUrl(paging.pageNumber + 1, searchParams)}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span>
              <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
```

**Pagination rules:**

- Pagination metadata uses `font-mono text-[10px] tracking-widest uppercase`.
- Use `asChild` on `Button` only when the page link is active; render a plain `<span>` when disabled.
- The `buildPageUrl` helper preserves all existing search params (filters, search) when changing pages.
- Page number comes from URL search params — never from React state.

#### Table rules summary

- No `@tanstack/react-table` or column definition objects — compose tables declaratively.
- Actions column is always the **last column**, right-aligned.
- Table heading text is uppercase mono — built into `TableHead`; never override it.
- Wrap tables in a parent `<div>` that also contains the pagination footer.
- Keep table body logic inside the list component (not split across sub-components per row unless a row exceeds ~30 lines).

### Dialog patterns

All form modals use `Dialog` (centered overlay). Use `AlertDialog` for destructive confirmations only.

**No `Sheet` (side drawer) for forms.** Forms always use `Dialog`.

#### Create form dialog (reference implementation)

```tsx
import * as React from 'react';
import { Loader, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { useCreateUser } from '../api/create-user';
import { FIELD_LABEL_CLASS } from '../constants';

const initialFormData = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  initialPassword: '',
  temporaryPassword: true,
  avatarImage: null as File | null,
};

const fieldLabel = FIELD_LABEL_CLASS;

export const CreateUser = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const createUserMutation = useCreateUser({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      },
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      username: formData.username,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      initialPassword: formData.initialPassword,
      temporaryPassword: formData.temporaryPassword,
      groupNames: null,
      avatarImage: formData.avatarImage,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus className="size-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new user.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-user-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="cu-username" className={fieldLabel}>
              Username <span className="text-destructive">*</span>
            </label>
            <Input
              id="cu-username"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Enter username"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="cu-firstName" className={fieldLabel}>
                First Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="cu-firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder="First name"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cu-lastName" className={fieldLabel}>
                Last Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="cu-lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Last name"
                required
              />
            </div>
          </div>

          {/* file upload, checkboxes, etc. */}
        </form>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            CANCEL
          </Button>
          <Button
            variant="secondary"
            type="submit"
            form="create-user-form"
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? <Loader /> : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

#### Edit form dialog

Edit dialogs follow the same pattern but receive entity data as props and reset form state via `useEffect` on open:

```tsx
export const UpdateUser = ({ userId, user }: UpdateUserProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    enabled: user.enabled,
    groupNames: user.groups?.map((g) => g.name!).filter(Boolean) || [],
    avatarImage: null as File | null,
  });

  const updateUserMutation = useUpdateUser({
    mutationConfig: { onSuccess: () => setOpen(false) },
  });

  // Reset form when dialog opens with fresh entity data
  React.useEffect(() => {
    if (open) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        enabled: user.enabled,
        groupNames: user.groups?.map((g) => g.name!).filter(Boolean) || [],
        avatarImage: null,
      });
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="action">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {/* DialogHeader, form, DialogFooter — same structure as Create */}
      </DialogContent>
    </Dialog>
  );
};
```

#### Destructive confirmation (AlertDialog)

Use `AlertDialog` for delete/deactivate/activate confirmations — never `Dialog`.

```tsx
export const DeactivateUser = ({ userId }: { userId: string }) => {
  const deactivateUserMutation = useDeactivateUser({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="action">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate this user?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deactivateUserMutation.isPending}
            onClick={() => deactivateUserMutation.mutate({ userId })}
          >
            {deactivateUserMutation.isPending ? <Loader /> : 'DEACTIVATE'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

**Dialog rules:**

- Define `initialFormData` as a module-level `const` for reliable resets.
- Submit button uses `form="form-id"` so it can live outside `<form>` in `DialogFooter`.
- Cancel button uses `variant="ghost"`, submit button uses `variant="secondary"`.
- Button text is uppercase: `CANCEL`, `SAVE`, `DEACTIVATE`.
- Loading state: `disabled={mutation.isPending}` + `{mutation.isPending ? <Loader /> : 'SAVE'}`.
- `DialogContent` uses `className="max-h-[90vh] overflow-y-auto sm:max-w-xl"` for long forms.
- Reset form on close: `onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}`.
- For edit dialogs, sync form state from props in a `useEffect` triggered by `open`.

### Field label styling

Field labels use a shared constant defined in the feature's `constants.ts`:

```tsx
export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';
```

Usage:

```tsx
<label htmlFor="cu-username" className={FIELD_LABEL_CLASS}>
  Username <span className="text-destructive">*</span>
</label>
```

### Detail view pattern

Detail views compose `Card` components in a grid layout:

```tsx
export const UserView = ({ userId }: { userId: string }) => {
  const userQuery = useUserDetail({ userId });

  if (userQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const user = userQuery.data?.result?.user;
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            firstName={user.firstName}
            username={user.username}
            size="md"
          />
          <div className="flex flex-col gap-1.5">
            <Badge variant={user.enabled ? 'default' : 'destructive'}>
              {user.enabled ? 'Active' : 'Disabled'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <UpdateUser userId={userId} user={user} />
          {user.enabled ? (
            <DeactivateUser userId={userId} />
          ) : (
            <ActivateUser userId={userId} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Basic user account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            {/* more fields */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

### Filter bar pattern

Filter bars use inline `<form>` with `<FilterSelect>` from shared components:

```tsx
export const UsersFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState({
    search: searchParams.get('search') || '',
    groupName: searchParams.get('groupName') || '',
    enabled: searchParams.get('enabled') || '',
  });

  const applyFilters = (next: typeof filters) => {
    const params = new URLSearchParams();
    if (next.search) params.set('search', next.search);
    if (next.groupName) params.set('groupName', next.groupName);
    if (next.enabled) params.set('enabled', next.enabled);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSelectChange = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    applyFilters(next);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background flex h-11 items-stretch overflow-hidden rounded-xl border"
    >
      <div className="flex flex-1 items-center gap-3 px-4">
        <Search className="text-muted-foreground size-3.5 shrink-0" />
        <input
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          placeholder="Search protocol database..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-mono text-[11px] uppercase tracking-widest outline-none"
        />
      </div>
      <div className="border-l" />
      <FilterSelect
        value={filters.groupName}
        onChange={(v) => handleSelectChange('groupName', v)}
      >
        <option value="">Roles</option>
        <option value="user">User</option>
      </FilterSelect>
      <div className="border-l" />
      <FilterSelect
        value={filters.enabled}
        onChange={(v) => handleSelectChange('enabled', v)}
      >
        <option value="">Status</option>
        <option value="true">Active</option>
        <option value="false">Disabled</option>
      </FilterSelect>
    </form>
  );
};
```

**Filter rules:**

- Filters apply immediately on select change (no submit needed for dropdowns).
- Text search requires form submit or dedicated apply button.
- Always reset page to `1` when filters change.
- Filter state is synced from URL search params on mount.

---

## 4. State — Zustand

- Separate `State` / `Actions` interfaces, combined into a `Store` type.
- Middleware order: `devtools` (outer) → `persist` (inner).
- Name `set()` calls with `'store/actionName'` for devtools clarity.
- Use `partialize` to persist state only (not actions).
- LocalStorage key prefix: `scilab-`.
- Export **selector functions** — never access store properties directly in components.

```tsx
interface AppState {
  filterPanelOpen: boolean;
}

interface AppActions {
  toggleFilterPanel: () => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        filterPanelOpen: false,
        toggleFilterPanel: () =>
          set(
            (s) => ({ filterPanelOpen: !s.filterPanelOpen }),
            false,
            'app/toggleFilterPanel',
          ),
      }),
      {
        name: 'scilab-app-storage',
        partialize: (s): AppState => ({ filterPanelOpen: s.filterPanelOpen }),
      },
    ),
    { name: 'AppStore' },
  ),
);

export const selectFilterPanelOpen = (s: AppStore) => s.filterPanelOpen;
```

**Rules:**

- Do not put server data in Zustand. React Query owns all server/async state.
- Use `useState` + context for ephemeral local UI state (open/closed, form values).
- Read the authenticated user via `useUser()` from `@/lib/auth` — never access Keycloak directly in components.

---

## 5. Routing

- **Always** lazy-load routes via dynamic `import()` and the `convert` helper.
- Authenticated routes wrapped in `<ProtectedRoute>` from `@/lib/auth`.
- Path constants in `config/paths.ts` with `getHref()` helpers — never raw string literals.
- All routes live under `/app/*` (authenticated).

```tsx
// config/paths.ts
export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  app: {
    root: { path: '/app', getHref: () => '/app' },
    userManagement: {
      users: { path: 'users', getHref: () => '/app/users' },
      user: {
        path: 'users/:userId',
        getHref: (userId: string) => `/app/users/${userId}`,
      },
    },
  },
} as const;
```

```tsx
// app/router.tsx — `any` is acceptable here: dynamic import() has no static module type
const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};
```

**Exports & lazy loading:** Route files are the only place that uses `export default`. The `convert` helper destructures the `default` export from the dynamic `import()` result. All other files use named exports exclusively.

**URL-based state:** Filters, pagination, and search belong in URL search params — not `useState`.

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const page = +(searchParams.get('page') || 1);
```

---

## 6. Styling

- Utility-first Tailwind CSS. No CSS modules, no inline `style={}` (unless truly dynamic).
- `cn()` (clsx + tailwind-merge) for all conditional or composed class names.
- Component variants via CVA (`cva(...)`) using **Tailwind utility classes only** — no custom CSS in CVA definitions.
- Semantic color tokens (`bg-primary`, `text-muted-foreground`) backed by CSS custom properties in `index.css`. The `index.css` `:root` block is the **single source of truth** for the color system and must map to the HyperDataLab design palette (Section 19.2).
- Never use raw hex values in `.tsx` component files — always go through Tailwind semantic tokens.
- Raw hex/oklch values are allowed **only** inside `index.css` in the `@theme` / `:root` blocks.

### Button usage

Use CVA `variant` and `size` props for all button styling.

```tsx
// Primary CTA — secondary variant (oxblood CTA hover, uppercase)
<Button variant="secondary">
  <Plus className="size-4" />
  Create User
</Button>

// Destructive confirmation
<Button variant="destructive" disabled={isPending}>DEACTIVATE</Button>

// Cancel
<Button variant="ghost">CANCEL</Button>

// Table row action — mono uppercase tonal fill
<Button variant="action">Edit</Button>

// Icon-only
<Button variant="ghost" size="icon"><PencilIcon /></Button>
```

General rules:

- Prefer `size-{n}` over `w-{n} h-{n}` for square elements.
- Use `space-y-{n}` for vertical stacking in forms. Use `gap-{n}` for flex/grid children.
- No fixed pixel values — use Tailwind's spacing scale.

---

## 7. TypeScript

- Strict mode + `noUnusedLocals`, `noUnusedParameters`.
- No `any`. Use `unknown` + narrowing or generics.
- Prefer `type` over `interface` — except for component props that extend native HTML elements, where `interface extends` is cleaner (e.g., `interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants>`).
- No non-null assertion (`!`) unless the value has been checked non-null in the same scope.
- Use optional chaining (`?.`) and nullish coalescing (`??`).
- `as const` on all constant objects and tuples.
- Zod for runtime validation + type inference (`z.infer<typeof schema>`).
- All backend-originated nullable fields: `T | null` (not `T | undefined`).
- Query params optional at call site: `?:` (undefined), not `| null`.

```tsx
// React Query type helpers (src/lib/react-query.ts)
export type ApiFnReturnType<FnType extends (...args: any) => Promise<any>> =
  Awaited<ReturnType<FnType>>;

export type QueryConfig<T extends (...args: any[]) => any> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>;

export type MutationConfig<
  MutationFnType extends (...args: any) => Promise<any>,
> = UseMutationOptions<
  ApiFnReturnType<MutationFnType>,
  Error,
  Parameters<MutationFnType>[0],
  unknown
>;
```

---

## 8. Imports Order

1. React / built-ins
2. External packages (`react-router`, `@tanstack/react-query`, `lucide-react`)
3. Internal (`@/components`, `@/lib`, `@/config`, `@/utils`, `@/types`)
4. Relative (same feature only — `../api/`, `../constants`, `./`)

Use barrel imports for `hooks/` and `components/layouts/`.

---

## 9. Custom Hooks

- Named `use*`, located in `hooks/`, re-exported via `hooks/index.ts`.
- `useCallback` for callbacks passed to children. `useMemo` for derived values.
- Return objects (not arrays). No JSX inside hooks.
- Use `import * as React from 'react'` — do not mix named imports and `React.*` in the same file.

---

## 10. Data Fetching

Every data-fetching operation follows a strict three-layer pattern.

### Layer 1 — API function

A plain async function that calls `api` and returns a typed `Promise`. Never call `api` directly in a component.

```tsx
// src/features/user-management/api/get-users.ts
export const getUsers = (
  params: GetUsersParams = {},
): Promise<GetUsersResultApiGetResponse> => {
  return api.get(USER_MANAGEMENT_API.USERS, { params });
};
```

For file uploads, build `FormData` **inside the API function** — never in the component:

```tsx
export const createUser = (
  data: CreateUserDto,
): Promise<StringApiCreatedResponse> => {
  const formData = new FormData();
  if (data.username) formData.append('username', data.username);
  if (data.email) formData.append('email', data.email);
  if (data.firstName) formData.append('firstName', data.firstName);
  if (data.lastName) formData.append('lastName', data.lastName);
  if (data.initialPassword)
    formData.append('initialPassword', data.initialPassword);
  formData.append('temporaryPassword', String(data.temporaryPassword));
  if (data.groupNames) {
    data.groupNames.forEach((name) => formData.append('groupNames', name));
  }
  if (data.avatarImage) formData.append('avatarImage', data.avatarImage);

  return api.post(USER_MANAGEMENT_API.USERS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

### Layer 2 — Query options factory

Always export the factory so it can be used in both `clientLoader` and `useQuery`.

```tsx
export const getUsersQueryOptions = (params: GetUsersParams = {}) =>
  queryOptions({
    queryKey: [USER_MANAGEMENT_QUERY_KEYS.USERS, params],
    queryFn: () => getUsers(params),
  });
```

### Layer 3 — Hook

```tsx
type UseUsersOptions = {
  params?: GetUsersParams;
  queryConfig?: QueryConfig<typeof getUsersQueryOptions>;
};

export const useUsers = ({ params = {}, queryConfig }: UseUsersOptions = {}) =>
  useQuery({ ...getUsersQueryOptions(params), ...queryConfig });
```

For single-entity queries:

```tsx
type UseUserOptions = {
  userId: string;
  queryConfig?: QueryConfig<typeof getUserQueryOptions>;
};

export const useUserDetail = ({ userId, queryConfig }: UseUserOptions) =>
  useQuery({ ...getUserQueryOptions(userId), ...queryConfig });
```

### Mutations

```tsx
type UseUpdateUserOptions = {
  mutationConfig?: MutationConfig<typeof updateUser>;
};

export const useUpdateUser = ({
  mutationConfig,
}: UseUpdateUserOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USER],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
```

**Rules:**

- Always include all params in the `queryKey` as a single object element.
- In mutation hooks: destructure `onSuccess`, call it after internal invalidations, spread `...restConfig` last.
- Never use `refetchQueries`. Always use `invalidateQueries`.
- Axios instance (`src/lib/api-client.ts`) injects the Keycloak bearer token on every request and handles 401 → token refresh → retry automatically.
- Default query config: `staleTime: 0`, `retry: false`, `refetchOnWindowFocus: false`.

### Constants file

Every feature must export two objects:

```tsx
// src/features/user-management/constants.ts
const SERVICE_PREFIX = '/user-service';

export const USER_MANAGEMENT_API = {
  USERS: `${SERVICE_PREFIX}/users`,
  USER_BY_ID: (userId: string) => `${SERVICE_PREFIX}/users/${userId}`,
  DEACTIVATE_USER: (userId: string) =>
    `${SERVICE_PREFIX}/users/${userId}/deactivate`,
  ACTIVATE_USER: (userId: string) =>
    `${SERVICE_PREFIX}/users/${userId}/activate`,
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const USER_MANAGEMENT_QUERY_KEYS = {
  USERS: 'users',
  USER: 'user',
} as const;
```

---

## 11. Forms

- Use `react-hook-form` + `zod` + `zodResolver` for complex forms; always provide `defaultValues`.
- Use plain `React.useState` for simple forms (1–3 fields) — the user-management feature uses this approach.
- Always call `e.preventDefault()` on submit handlers.
- Pass the entire form data object to `mutation.mutate()`. Never construct `FormData` in the component — do it inside the API function.
- Always use `htmlFor` on `<label>` with a matching `id` on the input.
- Mark required fields visually with `<span className="text-destructive">*</span>`.
- Label styling uses `FIELD_LABEL_CLASS` from the feature's `constants.ts`.
- Group related fields with `<div className="grid grid-cols-2 gap-4">` for side-by-side layout.
- Use `space-y-5` for vertical form field spacing inside the form.

### File upload in forms

```tsx
<div className="flex items-center gap-4">
  <UserAvatar
    avatarUrl={avatarPreview ?? user.avatarUrl}
    firstName={user.firstName}
    username={user.username}
    size="md"
  />
  <div className="flex-1 space-y-1">
    <Input
      id="uu-avatar"
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({ ...prev, avatarImage: file }));
        if (file) {
          setAvatarPreview(URL.createObjectURL(file));
        } else {
          setAvatarPreview(null);
        }
      }}
    />
    {avatarPreview && (
      <p className="text-muted-foreground text-xs">
        {formData.avatarImage?.name}
      </p>
    )}
  </div>
</div>
```

---

## 12. UI Components

- Stack: **Radix UI** primitives + **Shadcn** + **Lucide React** icons + **CVA**.
- No third-party component libraries (no MUI, Ant Design, Chakra).
- `components/ui/` — base primitives, one per file.
- `components/layouts/` — layout wrappers (`ContentLayout`, `DashboardLayout`).
- `components/errors/` — error boundary components.
- `components/seo/` — `<Head>` for page title/description.
- `features/{name}/components/` — feature-specific only.

### Component location decision tree

1. **Is it purely visual with no domain logic?** → `components/ui/` (e.g., `Button`, `Badge`, `UserAvatar`, `FilterSelect`)
2. **Is it a layout shell or page wrapper?** → `components/layouts/`
3. **Could multiple features use it?** → `components/ui/` — create it as a shared component
4. **Is it tied to a single feature's data types or API?** → `features/{name}/components/`

**Always look up `src/components/ui/` first.** If a needed component exists, use it. If a component you're building could serve another feature, put it in `components/ui/` from the start. Example: `UserAvatar` lives in `components/ui/user-avatar.tsx` because it's used in both the users list and user detail view — and could be used in any feature that shows users.

---

## 13. Route Components

- Thin and declarative — no business logic, no API calls, no complex state.
- Delegate all logic to `features/`.
- Export a `clientLoader` that prefetches using the `queryOptions` factory.
- Component name must match the file name in PascalCase.
- Collections: plural filename (`users.tsx`). Single entity: singular (`user.tsx`).

### Collection route (reference)

```tsx
// src/app/routes/app/user-management/users.tsx
import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { getUsersQueryOptions } from '@/features/user-management/api/get-users';
import { CreateUser } from '@/features/user-management/components/create-user';
import { UsersFilter } from '@/features/user-management/components/users-filter';
import { UsersList } from '@/features/user-management/components/users-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const searchText = url.searchParams.get('search') || undefined;
    const groupName = url.searchParams.get('groupName') || undefined;
    const enabled = url.searchParams.get('enabled') || undefined;

    const query = getUsersQueryOptions({
      pageNumber: page,
      pageSize: 10,
      searchText,
      groupName,
      enabled,
    });

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

const UsersRoute = () => (
  <ContentLayout title="User Management" description="Manage system users">
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <CreateUser />
      </div>
      <UsersFilter />
    </div>
    <div className="mt-4">
      <UsersList />
    </div>
  </ContentLayout>
);

export default UsersRoute;
```

### Detail route (reference)

```tsx
// src/app/routes/app/user-management/user.tsx
export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Record<string, string | undefined> }) => {
    const userId = params.userId as string;
    const query = getUserQueryOptions(userId);
    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

const UserRoute = () => {
  const params = useParams();
  const userId = params.userId as string;
  // ...
  return (
    <ContentLayout title={`${user.firstName} ${user.lastName}`}>
      <UserView userId={userId} />
    </ContentLayout>
  );
};

export default UserRoute;
```

---

## 14. Authorization

Authentication is handled entirely by Keycloak. The frontend never renders a login page — unauthenticated users are redirected to Keycloak by `<ProtectedRoute>`.

| Layer     | Responsibility                                                         |
| --------- | ---------------------------------------------------------------------- |
| Route     | `<ProtectedRoute>` blocks unauthenticated access — no business logic   |
| Feature   | Group-based UI rendering with `<Authorization>`                        |
| Component | Fine-grained conditional visibility via `checkAccess` or `policyCheck` |

```tsx
import { GROUPS, useAuthorization, Authorization } from '@/lib/authorization';

// Hook-based
const { checkAccess } = useAuthorization();
const canEdit = checkAccess({ allowedGroups: [GROUPS.SYSTEM_ADMIN] });

// Component-based (preferred for conditional rendering)
<Authorization allowedGroups={[GROUPS.SYSTEM_ADMIN]}>
  <AdminPanel />
</Authorization>

// Policy-based
<Authorization policyCheck={comment.author.id === user.id}>
  <DeleteButton />
</Authorization>
```

Groups enum in `src/lib/authorization.tsx`:

```tsx
export enum GROUPS {
  SYSTEM_ADMIN = 'system:admin',
  PROJECT_AUTHOR = 'project:author',
  PROJECT_PUBLISHER = 'project:publisher',
  PROJECT_CONTRIBUTOR = 'project:contributor',
}
```

Never hard-code group strings like `'system:admin'` outside that file. Use `GROUPS.SYSTEM_ADMIN`.

---

## 15. Animations

Animations should feel restrained and deliberate — precision over playfulness.

### Principles

- **Purposeful:** animate to communicate state change (appear, disappear, load, complete).
- **Fast:** entry durations 150–250ms, exit 100–150ms.
- **Easing:** use `ease-out` for entries, `ease-in` for exits.
- **Never animate layout properties** (`width`, `height`, `top`, `left`) — use `transform` and `opacity` only.

### Standard Classes (Tailwind)

```tsx
// Page / section entry
<div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">

// Dialog entry — built into DialogContent, no extra classes needed

// List item stagger
<div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-150" style={{ animationDelay: `${index * 30}ms` }}>
```

### Button Interactions

The `action` variant includes `active:scale-[0.98]` for press feedback. For custom buttons:

```tsx
<button className="... transition-transform duration-100 active:scale-[0.97]">
```

### Skeleton Loading

Use `Skeleton` components with pulse animation for loading states — never spinners inside data containers.

```tsx
if (query.isLoading) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
```

### Rules

- `transition-colors duration-150` on interactive elements that change color on hover/focus.
- No `transition-all` — always specify the exact property.
- Respect `prefers-reduced-motion`: use `motion-safe:` prefix when adding non-essential animations.

---

## 16. Error Handling

- Never show raw backend error messages in the UI.
- All mutation errors display as toasts via `sonner`. Dialog components do not render inline error alerts for mutation failures.
- The Axios interceptor in `api-client.ts` handles 401 → Keycloak token refresh → retry automatically. Components never need to handle auth errors.

---

## 17. Commenting Rules

- No decorative or section-separator comments.
- No comments for obvious code.
- No grouping code blocks with comments as labels.
- Use numbered step comments for multi-step flows:

```ts
// 1. Validate input
// 2. Call API
// 3. Update cache
```

- Use inline comments only for non-obvious logic:

```ts
// Backend returns value in cents — convert to display currency
```

- Prefer self-documenting code. If a block needs explanation, extract it into a named function.
- No `console.log` in committed code.

---

## 18. General Rules

- No `any`. No inline `style={}`. No raw CSS files.
- No default exports except route components.
- Use `cn()` for conditional classes — never string concatenation.
- No `console.log` in committed code.
- Keep components under ~150 lines. Extract sub-components or hooks if larger.
- Co-locate feature code in `features/{name}/`. Never put business logic outside `features/`.
- Prefer composition over prop drilling.
- `useCallback` for callbacks passed to memoized children. `useMemo` for expensive derivations.
- No third-party component libraries (no MUI, Ant Design, Chakra, etc.).

### New Feature Checklist

- [ ] `src/features/{name}/types.ts` — DTOs, response types, params types
- [ ] `src/features/{name}/constants.ts` — API routes + query keys + `FIELD_LABEL_CLASS`
- [ ] `src/features/{name}/api/get-{entities}.ts` — fn + queryOptions + hook
- [ ] `src/features/{name}/api/get-{entity}.ts` — fn + queryOptions + hook
- [ ] `src/features/{name}/api/create-{entity}.ts` — mutation fn + hook
- [ ] `src/features/{name}/api/update-{entity}.ts` — mutation fn + hook
- [ ] `src/features/{name}/api/delete-{entity}.ts` — mutation fn + hook (if needed)
- [ ] `src/features/{name}/components/` — list, create, update, detail view, filter
- [ ] `src/app/routes/app/{name}/{entities}.tsx` — route file with `clientLoader`
- [ ] `src/config/paths.ts` — add `path` and `getHref` entries
- [ ] `src/app/router.tsx` — add lazy-loaded route entry

Quality checks:

- [ ] **Shared components checked first** — verify `src/components/ui/` for existing primitives before writing feature-specific components
- [ ] All hooks accept optional `queryConfig` / `mutationConfig`
- [ ] Mutation hooks invalidate correct query keys; call `onSuccess?.(...args)` after
- [ ] Route exports `clientLoader` using `queryOptions` factory
- [ ] List component: loading (Skeleton) → empty → data
- [ ] Forms use `Dialog` (not `Sheet`); reset on success and on dialog close
- [ ] Buttons use CVA `variant` props; navigation uses `paths` constants
- [ ] `yarn format && yarn lint && yarn check-types` pass

---

## 19. Design System: HyperDataLab

### 19.1 Design Direction

HyperDataLab's visual identity is a **high-precision research instrument** — built for clarity, permanence, and rigorous data work. It rejects the generic SaaS aesthetic. Layout uses **editorial asymmetry**: dramatic typography scale shifts, intentional white space as a functional element, and layered metadata components that give the interface depth and structure appropriate to a serious research platform.

---

### 19.2 Colors

The palette is rooted in the physical world — ink on parchment, stone, and oxidized red.

| Token          | Hex       | Role                                                                      |
| -------------- | --------- | ------------------------------------------------------------------------- |
| `surface`      | `#fbf9f6` | Background — warm off-white parchment (replaces pure `#ffffff`)           |
| `primary`      | `#181512` | Deep charcoal ink — the darkest value in the palette (replaces `#000000`) |
| `secondary`    | `#635e56` | Muted stone for metadata and structural grounding                         |
| `tertiary`     | `#350002` | Oxblood — critical alerts, final validation actions                       |
| `muted-bronze` | `#D4AF37` | Reserve for authenticated stamps and premium highlights                   |

**Absolute rule:** No `#000000` (true black) and no `#ffffff` (true white) anywhere in the codebase. Use `primary` (#181512) as the darkest ink and `surface` (#fbf9f6) as the lightest background. This applies to all tokens, button text, borders, and shadows.

#### Surface Hierarchy

Treat the UI as stacked sheets of fine paper. Use tonal shifts — never 1px solid borders — to define sections.

| Token                       | Hex       | Usage                                      |
| --------------------------- | --------- | ------------------------------------------ |
| `surface-dim`               | `#dbdad7` | Deepest — background work areas            |
| `surface`                   | `#fbf9f6` | Base — primary page                        |
| `surface-container-low`     | `#f5f3f0` | Recessed sections — the "milled" separator |
| `surface-container`         | `#efeeeb` | Table rows, card fills                     |
| `surface-container-highest` | `#e4e2df` | Elevated — active modal-like content       |

**Rules:**

- No blue. Use Oxblood (`tertiary`) and Bronze (`muted-bronze`) for emphasis only.
- No gradients. Color must be flat, mimicking the limitations of a printing press.
- No 1px solid borders for sections — boundaries are defined through tonal shifts.
- Ghost Border fallback: if a border is required for accessibility in inputs, use `outline-variant` at 20% opacity.

---

### 19.3 Typography

Typography is a dialogue between the **Transitional Serif** (The Authority) and the **Swiss Sans** (The Instrument).

| Role                  | Font                 | Tailwind class               | Usage                                      |
| --------------------- | -------------------- | ---------------------------- | ------------------------------------------ |
| Display / Headlines   | `Newsreader` (Serif) | `font-serif`                 | Main titles, editorial front-page impact   |
| Titles / UI Labels    | `Inter` (Sans-Serif) | default body                 | Navigation, section headers                |
| Body                  | `Inter`              | default, `leading-relaxed`   | Scientific-paper legibility                |
| Data / Metadata / IDs | `Space Grotesk`      | `font-mono text-[10px]` etc. | Technical IDs, timestamps, data references |

`ContentLayout` title uses `text-primary font-serif text-4xl font-extrabold tracking-tight`.

---

### 19.4 Elevation & Depth

Hierarchy is achieved through surface tiers, not shadows. Place a `surface-container-lowest` card on a `surface-container-low` section to create a natural lift.

**Hard Shadow** (for floating high-priority actions):

```css
box-shadow: 2px 2px 0px rgba(24, 21, 18, 0.15);
```

---

### 19.5 Components

**Buttons** — Use CVA variants defined in `button.tsx`. The `action` variant has mono uppercase with tonal surface fill. The `secondary` variant uses oxblood CTA hover background.

**Cards** — Use shared `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `components/ui/card.tsx`. Cards have `bg-card rounded-xl border shadow-sm`.

**Input Fields** — Use shared `Input` from `components/ui/input.tsx`. Bottom border focus ring via `focus-visible:border-ring focus-visible:ring-ring/50`.

**Status Indicators** — Dot (`size-2 shrink-0 rounded-full` + color) + label (`font-mono text-[10px] tracking-wider uppercase`).

**Data Tables** — High density. Column headers are uppercase mono. Rows use tonal background shifts (`surface-container-low` → `surface-container` on hover). Actions column right-aligned. See Section 3 "Table usage".

**Dialogs** — Centered overlay with `rounded-2xl`. Title uses `font-serif text-4xl font-extrabold`. See Section 3 "Dialog patterns".

**AlertDialogs** — For destructive confirmations. `AlertDialogAction` and `AlertDialogCancel` accept `variant` prop matching `buttonVariants`.

---

### 19.6 Layout

- `ContentLayout` wraps every page with a serif title and optional description.
- Collapsible filter panels or contextual side panels within a feature page are acceptable.
- Every element uses the border-radius scale from `index.css` (`--radius` tokens).
