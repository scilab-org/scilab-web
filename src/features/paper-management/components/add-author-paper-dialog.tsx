import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/lib/auth';

import { useAuthorRoles } from '@/features/author-role-management/api/get-author-roles';
import { useAvailablePaperAuthors } from '@/features/paper-management/api/get-available-paper-authors';
import { useMemberAffiliations } from '@/features/project-management/api/members/get-member-affiliations';

import { useCreatePaperAuthor } from '../api/create-paper-author';
import { useUpdatePaperAuthor } from '../api/update-paper-author';
import { FIELD_LABEL_CLASS } from '../constants';
import type { AvailablePaperAuthorItem, PaperContributorItem } from '../types';

type AddAuthorPaperDialogProps = {
  subProjectId: string;
  paperId: string;
  isManager: boolean;
  isAuthor?: boolean;
  author?: PaperContributorItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialFormState = {
  selectedUserId: null as string | null,
  selectedMemberId: null as string | null,
  selectedAuthorRoleId: '' as string,
  selectedAffiliationId: null as string | null,
  selectedAffiliationName: '' as string,
  name: '',
  email: '',
  ocrid: '',
};

export const AddAuthorPaperDialog = ({
  subProjectId,
  paperId,
  isManager,
  isAuthor = false,
  author = null,
  open,
  onOpenChange,
}: AddAuthorPaperDialogProps) => {
  const { data: user } = useUser();
  const isSystemAdmin = user?.groups?.includes('system:admin') ?? false;

  const [searchText, setSearchText] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialFormState.selectedUserId,
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    initialFormState.selectedMemberId,
  );
  const [selectedAuthorRoleId, setSelectedAuthorRoleId] = useState<string>(
    initialFormState.selectedAuthorRoleId,
  );
  const [selectedAffiliationId, setSelectedAffiliationId] = useState<
    string | null
  >(initialFormState.selectedAffiliationId);
  const [selectedAffiliationName, setSelectedAffiliationName] =
    useState<string>(initialFormState.selectedAffiliationName);
  const [authorRoleOpen, setAuthorRoleOpen] = useState(false);
  const [authorRoleSearch, setAuthorRoleSearch] = useState('');
  const [affiliationOpen, setAffiliationOpen] = useState(false);
  const [affiliationSearch, setAffiliationSearch] = useState('');
  const [authorPickerOpen, setAuthorPickerOpen] = useState(false);
  const [name, setName] = useState(initialFormState.name);
  const [email, setEmail] = useState(initialFormState.email);
  const [ocrid, setOcrid] = useState(initialFormState.ocrid);
  const [selectedAuthor, setSelectedAuthor] =
    useState<AvailablePaperAuthorItem | null>(null);

  // Fetch author roles (must be before useMemo that depends on authorRoles)
  const { data: authorRolesResponse, isLoading: isLoadingRoles } =
    useAuthorRoles({
      params: { PageNumber: 1, PageSize: 100 },
      queryConfig: { enabled: open },
    });
  const authorRoles = authorRolesResponse?.result?.items || [];

  const canAddMembers = (isManager || isAuthor) && !isSystemAdmin;
  const isEditMode = Boolean(author?.id);

  useEffect(() => {
    if (!open) return;

    setSearchText('');
    setAuthorRoleOpen(false);
    setAuthorRoleSearch('');
    setAffiliationOpen(false);
    setAffiliationSearch('');
    setAuthorPickerOpen(false);
    if (author) {
      setSelectedUserId((author as { userId?: string | null }).userId ?? null);
      setSelectedMemberId(author.memberId ?? null);
      setSelectedAuthorRoleId(
        (author as { authorRoleId?: string }).authorRoleId ?? '',
      );
      setSelectedAffiliationId(
        (author as { affiliationId?: string | null }).affiliationId ?? null,
      );
      setSelectedAffiliationName(
        (author as { affiliationName?: string }).affiliationName ?? '',
      );
      setName(
        (author as { name?: string }).name ?? author.contributorName ?? '',
      );
      setEmail(
        (author as { email?: string }).email ?? author.contributorEmail ?? '',
      );
      setOcrid(
        (author as { ocrId?: string; ocrid?: string }).ocrId ??
          (author as { ocrid?: string }).ocrid ??
          '',
      );
      return;
    }

    setSelectedUserId(initialFormState.selectedUserId);
    setSelectedMemberId(initialFormState.selectedMemberId);
    setSelectedAuthorRoleId(initialFormState.selectedAuthorRoleId);
    setSelectedAffiliationId(initialFormState.selectedAffiliationId);
    setSelectedAffiliationName(initialFormState.selectedAffiliationName);
    setName(initialFormState.name);
    setEmail(initialFormState.email);
    setOcrid(initialFormState.ocrid);
  }, [author, open]);

  const availableAuthorsQuery = useAvailablePaperAuthors({
    subProjectId,
    params: { paperId, PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: open && !isEditMode },
  });

  const memberAffiliationsQuery = useMemberAffiliations({
    memberId: selectedMemberId,
    queryConfig: { enabled: open && !!selectedMemberId },
  });
  const memberAffiliations = useMemo(
    () => memberAffiliationsQuery.data?.result?.items ?? [],
    [memberAffiliationsQuery.data?.result?.items],
  );

  // Auto-select affiliation if exactly 1
  useEffect(() => {
    if (memberAffiliations.length === 1 && !selectedAffiliationId) {
      const affil = memberAffiliations[0].affiliation;
      if (affil) {
        setSelectedAffiliationId(affil.id);
        setSelectedAffiliationName(affil.name || '');
      }
    }
  }, [memberAffiliations, selectedAffiliationId]);
  const availableAuthors = useMemo(
    () => availableAuthorsQuery.data?.result?.items ?? [],
    [availableAuthorsQuery.data?.result?.items],
  );
  const filteredAuthors = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return availableAuthors;
    return availableAuthors.filter((a) => {
      return (
        a.email?.toLowerCase().includes(q) ||
        a.username?.toLowerCase().includes(q) ||
        `${a.firstName} ${a.lastName}`.trim().toLowerCase().includes(q)
      );
    });
  }, [availableAuthors, searchText]);

  // Add author mutation
  const createPaperAuthorMutation = useCreatePaperAuthor({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Author added successfully');
        handleClose();
      },
      onError: () => {
        toast.error('Failed to add author. Please try again.');
      },
    },
  });

  const updatePaperAuthorMutation = useUpdatePaperAuthor({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Author updated successfully');
        handleClose();
      },
      onError: () => {
        toast.error('Failed to update author. Please try again.');
      },
    },
  });

  const handleToggleUser = (member: AvailablePaperAuthorItem) => {
    if (selectedUserId === member.userId) {
      setSelectedUserId(initialFormState.selectedUserId);
      setSelectedMemberId(initialFormState.selectedMemberId);
      setSelectedAuthor(null);
      setSelectedAffiliationId(initialFormState.selectedAffiliationId);
      setSelectedAffiliationName(initialFormState.selectedAffiliationName);
      setName(initialFormState.name);
      setEmail(initialFormState.email);
      setOcrid(initialFormState.ocrid);
      return;
    }

    setSelectedAuthor(member);
    setSelectedUserId(member.userId);
    setSelectedMemberId(member.memberId);
    setSelectedAffiliationId(initialFormState.selectedAffiliationId);
    setSelectedAffiliationName(initialFormState.selectedAffiliationName);
    setName(
      `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
        member.username ||
        '',
    );
    setEmail(member.email || '');
    setOcrid(member.orcid ?? '');
  };

  const handleAdd = () => {
    if (!selectedUserId || !selectedMemberId || !selectedAuthorRoleId) return;

    const selectedUser =
      selectedAuthor ??
      availableAuthors.find((a) => a.userId === selectedUserId);
    if (!selectedUser) return;

    const fallbackName =
      `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
      selectedUser.username ||
      '';

    const payload = {
      name: name.trim() || fallbackName,
      email: email.trim() || selectedUser.email || '',
      ocrid: ocrid.trim() || null,
      paperId: author?.paperId ?? null,
      projectId:
        (author as { projectId?: string | null } | null)?.projectId ?? null,
      memberId: author?.memberId ?? null,
      authorRoleId: selectedAuthorRoleId,
      affiliationId: selectedAffiliationId,
      affiliationName: selectedAffiliationName.trim() || null,
    };

    if (author?.id) {
      updatePaperAuthorMutation.mutate({ id: author.id, data: payload });
      return;
    }

    createPaperAuthorMutation.mutate({
      ...payload,
      paperId,
      projectId: subProjectId,
      memberId: selectedMemberId,
    });
  };

  const handleClose = () => {
    setSelectedUserId(initialFormState.selectedUserId);
    setSelectedMemberId(initialFormState.selectedMemberId);
    setSelectedAuthorRoleId(initialFormState.selectedAuthorRoleId);
    setSelectedAffiliationId(initialFormState.selectedAffiliationId);
    setSelectedAffiliationName(initialFormState.selectedAffiliationName);
    setSearchText('');
    setAuthorRoleOpen(false);
    setAuthorRoleSearch('');
    setAffiliationOpen(false);
    setAffiliationSearch('');
    setSelectedAuthor(null);
    setName(initialFormState.name);
    setEmail(initialFormState.email);
    setOcrid(initialFormState.ocrid);
    onOpenChange(false);
  };

  const isPending =
    createPaperAuthorMutation.isPending || updatePaperAuthorMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="size-5" />
            <DialogTitle>
              {isEditMode ? 'Update Paper Author' : 'Add Author to Paper'}
            </DialogTitle>
          </div>
          <DialogDescription className="truncate">
            {isEditMode
              ? 'Update the author information and assigned role.'
              : 'Select an author and assign a role.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {canAddMembers ? (
            <>
              {isEditMode ? null : (
                <div className="space-y-2">
                  <label
                    htmlFor="paper-author-select"
                    className={FIELD_LABEL_CLASS}
                  >
                    Select Author
                  </label>
                  <Popover
                    open={authorPickerOpen}
                    onOpenChange={setAuthorPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id="paper-author-select"
                        type="button"
                        variant="outline"
                        className="border-surface-container-highest bg-surface-container h-11 w-full justify-between rounded-xl px-3 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {selectedAuthor
                            ? `${selectedAuthor.firstName} ${selectedAuthor.lastName}`.trim() ||
                              selectedAuthor.username
                            : 'Select author'}
                        </span>
                        <ChevronDown className="size-4 shrink-0 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-[var(--radix-popper-anchor-width)] p-2"
                    >
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          <Input
                            placeholder="Search by name, email, or username..."
                            value={searchText}
                            onChange={(event) =>
                              setSearchText(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') event.preventDefault();
                            }}
                            className="pl-10"
                          />
                        </div>
                        <div className="max-h-72 space-y-1 overflow-y-auto">
                          {availableAuthorsQuery.isLoading ? (
                            <>
                              <Skeleton className="h-14 w-full rounded-xl" />
                              <Skeleton className="h-14 w-full rounded-xl" />
                            </>
                          ) : filteredAuthors.length > 0 ? (
                            filteredAuthors.map((member) => {
                              const isSelected =
                                selectedUserId === member.userId;

                              return (
                                <button
                                  key={member.userId}
                                  type="button"
                                  onClick={() => {
                                    handleToggleUser(member);
                                    setAuthorPickerOpen(false);
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                                    isSelected
                                      ? 'border-primary/30 bg-surface-container-highest'
                                      : 'bg-surface-container hover:bg-surface-container-highest border-transparent'
                                  }`}
                                >
                                  <div
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                                      isSelected
                                        ? 'bg-primary text-surface'
                                        : 'bg-surface-dim text-secondary'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <Check className="size-4" />
                                    ) : (
                                      <Users className="size-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-primary truncate text-sm font-semibold">
                                      {member.firstName} {member.lastName}
                                    </p>
                                    <p className="text-secondary truncate font-mono text-[10px] tracking-widest uppercase">
                                      {member.email || 'No email'}
                                      {member.username &&
                                        ` · @${member.username}`}
                                    </p>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="bg-surface-container rounded-xl py-10 text-center">
                              <p className="text-secondary text-sm">
                                {searchText
                                  ? `No authors found for "${searchText}"`
                                  : 'No available authors in this project'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="paper-author-role"
                  className={FIELD_LABEL_CLASS}
                >
                  Author Role
                </label>
                {isLoadingRoles ? (
                  <Skeleton className="h-11 w-full rounded-xl" />
                ) : (
                  <Popover
                    open={authorRoleOpen}
                    onOpenChange={setAuthorRoleOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-surface-container-highest bg-surface-container h-11 w-full justify-between rounded-xl px-3 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {authorRoles.find(
                            (role) => role.id === selectedAuthorRoleId,
                          )?.name ?? 'Select a role'}
                        </span>
                        <ChevronDown className="size-4 shrink-0 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-[var(--radix-popper-anchor-width)] p-2"
                    >
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          <Input
                            value={authorRoleSearch}
                            onChange={(event) =>
                              setAuthorRoleSearch(event.target.value)
                            }
                            placeholder="Search roles..."
                            className="pl-10"
                          />
                        </div>
                        <div className="max-h-64 space-y-1 overflow-y-auto">
                          {authorRoles
                            .filter((role) => {
                              const query = authorRoleSearch
                                .trim()
                                .toLowerCase();
                              if (!query) return true;
                              return (
                                role.name.toLowerCase().includes(query) ||
                                (role.description ?? '')
                                  .toLowerCase()
                                  .includes(query)
                              );
                            })
                            .map((role) => {
                              const isSelected =
                                selectedAuthorRoleId === role.id;

                              return (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAuthorRoleId(role.id);
                                    setAuthorRoleOpen(false);
                                  }}
                                  className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                                    isSelected
                                      ? 'bg-surface-container-highest'
                                      : 'hover:bg-surface-container'
                                  }`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="text-primary block truncate text-sm font-semibold">
                                      {role.name}
                                    </span>
                                    {role.description ? (
                                      <span className="text-secondary block truncate font-mono text-[10px] tracking-widest uppercase">
                                        {role.description}
                                      </span>
                                    ) : null}
                                  </span>
                                  <Check
                                    className={`ml-3 size-4 shrink-0 ${
                                      isSelected
                                        ? 'text-primary'
                                        : 'text-transparent'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          {!authorRoles.some((role) => {
                            const query = authorRoleSearch.trim().toLowerCase();
                            return (
                              !query ||
                              role.name.toLowerCase().includes(query) ||
                              (role.description ?? '')
                                .toLowerCase()
                                .includes(query)
                            );
                          }) ? (
                            <div className="text-secondary px-3 py-6 text-center text-sm">
                              No roles found.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="paper-author-affiliation"
                  className={FIELD_LABEL_CLASS}
                >
                  Affiliation
                </label>
                {memberAffiliationsQuery.isLoading ? (
                  <Skeleton className="h-11 w-full rounded-xl" />
                ) : (
                  <Popover
                    open={affiliationOpen}
                    onOpenChange={(open) => {
                      if (selectedMemberId) setAffiliationOpen(open);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!selectedMemberId}
                        className="border-surface-container-highest bg-surface-container h-11 w-full justify-between rounded-xl px-3 text-left disabled:opacity-50"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {!selectedMemberId
                            ? 'Select an author first'
                            : selectedAffiliationName ||
                              'Select an affiliation'}
                        </span>
                        <ChevronDown className="size-4 shrink-0 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    {selectedMemberId && (
                      <PopoverContent
                        align="start"
                        className="w-[var(--radix-popper-anchor-width)] p-2"
                      >
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                              value={affiliationSearch}
                              onChange={(event) =>
                                setAffiliationSearch(event.target.value)
                              }
                              placeholder="Search affiliations..."
                              className="pl-10"
                            />
                          </div>
                          <div className="max-h-64 space-y-1 overflow-y-auto">
                            {memberAffiliations.length > 0 ? (
                              memberAffiliations
                                .filter((affil: any) => {
                                  const query = affiliationSearch
                                    .trim()
                                    .toLowerCase();
                                  if (!query) return true;
                                  return (affil.affiliation?.name || '')
                                    .toLowerCase()
                                    .includes(query);
                                })
                                .map((affil: any) => {
                                  const roleId = affil.affiliation?.id;
                                  const roleName =
                                    affil.affiliation?.name || '';
                                  const isSelected =
                                    selectedAffiliationId === roleId;

                                  return (
                                    <button
                                      key={roleId}
                                      type="button"
                                      onClick={() => {
                                        setSelectedAffiliationId(roleId);
                                        setSelectedAffiliationName(roleName);
                                        setAffiliationOpen(false);
                                      }}
                                      className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                                        isSelected
                                          ? 'bg-surface-container-highest'
                                          : 'hover:bg-surface-container'
                                      }`}
                                    >
                                      <span className="min-w-0 flex-1">
                                        <span className="text-primary block truncate text-sm font-semibold">
                                          {roleName}
                                        </span>
                                      </span>
                                      <Check
                                        className={`ml-3 size-4 shrink-0 ${
                                          isSelected
                                            ? 'text-primary'
                                            : 'text-transparent'
                                        }`}
                                      />
                                    </button>
                                  );
                                })
                            ) : (
                              <div className="text-secondary px-3 py-6 text-center text-sm">
                                No affiliations found for this member.
                              </div>
                            )}
                            {memberAffiliations.length > 0 &&
                            !memberAffiliations.some((affil: any) => {
                              const query = affiliationSearch
                                .trim()
                                .toLowerCase();
                              return (
                                !query ||
                                (affil.affiliation?.name || '')
                                  .toLowerCase()
                                  .includes(query)
                              );
                            }) ? (
                              <div className="text-secondary px-3 py-6 text-center text-sm">
                                No affiliations matching &quot;
                                {affiliationSearch}&quot;.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="paper-author-name"
                    className={FIELD_LABEL_CLASS}
                  >
                    Name
                  </label>
                  <Input
                    id="paper-author-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter author name"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="paper-author-email"
                    className={FIELD_LABEL_CLASS}
                  >
                    Email
                  </label>
                  <Input
                    id="paper-author-email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter author email"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor="paper-author-ocrid"
                    className={FIELD_LABEL_CLASS}
                  >
                    OCR ID
                  </label>
                  <Input
                    id="paper-author-ocrid"
                    value={ocrid}
                    onChange={(event) => setOcrid(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface-container rounded-xl py-10 text-center">
              <p className="text-secondary text-sm">
                You do not have permission to add authors.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
          >
            CANCEL
          </Button>
          <Button
            type="button"
            variant="darkRed"
            onClick={handleAdd}
            disabled={
              isPending ||
              !selectedAuthorRoleId ||
              !name.trim() ||
              !email.trim() ||
              !canAddMembers ||
              (!isEditMode && !selectedUserId)
            }
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEditMode ? 'UPDATE' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
