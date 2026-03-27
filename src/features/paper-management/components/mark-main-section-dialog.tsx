import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useGetPaperSections } from '../api/get-paper-sections';
import { useMarkSection } from '../api/get-mark-section';
import { useMarkMainSection } from '../api/mark-main-section';
import { useAssignedSections } from '../api/get-assigned-sections';
import { PAPER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { BTN } from '@/lib/button-styles';

type MarkMainSectionDialogProps = {
  paperId: string;
  subProjectId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const MarkMainSectionDialog = ({
  paperId,
  subProjectId,
  isOpen,
  onOpenChange,
}: MarkMainSectionDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const assignedSectionsQuery = useAssignedSections({
    paperId,
    queryConfig: {
      enabled: isOpen,
    } as any,
  });

  const dialogSubProjectId =
    assignedSectionsQuery.data?.result?.subProjectId || subProjectId;

  const sectionsQuery = useGetPaperSections({
    paperId,
    queryConfig: {
      enabled: isOpen,
    } as any,
  });

  const versionsQuery = useMarkSection({
    markSectionId: selectedSectionId || null,
  });

  const markMutation = useMarkMainSection({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Main section marked successfully');
        setIsConfirmOpen(false);
        onOpenChange(false);
        setSelectedSectionId('');
        setSelectedVersionId('');
        queryClient.invalidateQueries({
          queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_SECTIONS, paperId],
        });
        queryClient.invalidateQueries({
          queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS, paperId],
        });
        if (selectedSectionId) {
          queryClient.invalidateQueries({
            queryKey: [
              PAPER_MANAGEMENT_QUERY_KEYS.MARK_SECTION,
              selectedSectionId,
            ],
          });
        }
      },
      onError: () => {
        toast.error('Failed to mark main section');
      },
    },
  });

  const sections = sectionsQuery.data?.result?.items ?? [];
  const allVersions = versionsQuery.data?.result?.items ?? [];

  // Strictly filter by the currently selected section to avoid any ghost versions from other sections
  const versions = allVersions.filter(
    (v) =>
      v.markSectionId === selectedSectionId ||
      v.sectionId === selectedSectionId,
  );

  const sortedVersions = [...versions].sort((a, b) => {
    return (
      new Date(b.createdOnUtc || '').getTime() -
      new Date(a.createdOnUtc || '').getTime()
    );
  });

  const latestVersions = sortedVersions.filter(
    (v, i, self) => self.findIndex((x) => x.memberId === v.memberId) === i,
  );

  const handleConfirm = () => {
    if (!selectedSectionId || !selectedVersionId) return;
    markMutation.mutate({
      versionSectionId: selectedVersionId,
      projectId: dialogSubProjectId,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedSectionId('');
      setSelectedVersionId('');
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Mark Main Section</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="sectionSelect"
                className="text-foreground text-sm font-medium"
              >
                Select Section
              </label>
              <select
                id="sectionSelect"
                className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  setSelectedVersionId('');
                }}
              >
                <option value="" disabled>
                  {sectionsQuery.isLoading
                    ? 'Loading sections...'
                    : 'Select a section'}
                </option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
              {sections.length === 0 && !sectionsQuery.isLoading && (
                <div className="text-muted-foreground px-2 py-2 text-sm">
                  No sections available
                </div>
              )}
            </div>

            {selectedSectionId && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="versionSelect"
                  className="text-foreground text-sm font-medium"
                >
                  Select Version
                </label>
                <select
                  id="versionSelect"
                  className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  value={selectedVersionId}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                >
                  <option value="" disabled>
                    {versionsQuery.isLoading
                      ? 'Loading versions...'
                      : 'Select a version'}
                  </option>
                  {latestVersions.map((version) => {
                    const isMain =
                      version.isMainSection ||
                      version.sectionId === version.markSectionId;
                    return (
                      <option key={version.sectionId} value={version.sectionId}>
                        {version.name} {isMain ? '(Current Main)' : ''} -{' '}
                        {version.email}
                      </option>
                    );
                  })}
                </select>
                {latestVersions.length === 0 && !versionsQuery.isLoading && (
                  <div className="text-muted-foreground px-2 py-2 text-sm">
                    No versions available
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              className={BTN.CANCEL}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={BTN.EDIT}
              disabled={
                !selectedSectionId ||
                !selectedVersionId ||
                markMutation.isPending
              }
              onClick={() => setIsConfirmOpen(true)}
            >
              Mark as Main
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the selected version as the main version for
              this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={markMutation.isPending}
              className={BTN.CANCEL}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={BTN.EDIT}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={markMutation.isPending}
            >
              {markMutation.isPending ? 'Marking...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
