import { useState } from 'react';
import { Layers, Loader2, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { useAssignedSections } from '../api/get-assigned-sections';
import { AssignedSection } from '../types';
import { SectionComments } from './section-comments';

type PaperSectionsSheetProps = {
  paperId: string;
  paperTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const getSectionRoleColor = (role: string) => {
  const r = role.toLowerCase();
  if (r.includes('write'))
    return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  if (r.includes('read'))
    return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
};

const SectionItem = ({
  section,
  index,
}: {
  section: AssignedSection;
  index: number;
}) => {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="border-border rounded-lg border p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-6 shrink-0 text-right text-sm font-medium">
              {index + 1}.
            </span>
            <p className="text-foreground text-sm leading-snug font-medium wrap-break-word">
              {section.title || '(Untitled)'}
            </p>
          </div>
          {section.sectionSumary && (
            <p className="text-muted-foreground pl-8 text-xs leading-relaxed">
              {section.sectionSumary}
            </p>
          )}
          {section.content && (
            <p className="text-muted-foreground line-clamp-2 pl-8 text-xs leading-relaxed">
              {section.content}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getSectionRoleColor(section.sectionRole)}`}
          >
            {section.sectionRole.replace('section:', '')}
          </span>
          <span className="text-muted-foreground text-xs">
            Order: {section.displayOrder}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 text-xs"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
          {showComments ? 'Hide Comments' : 'View Comments'}
        </Button>
      </div>

      {showComments && (
        <SectionComments
          sectionId={section.id}
          isReadOnly={!['paper:author', 'section:edit'].includes(section.sectionRole)}
        />
      )}
    </div>
  );
};

export const PaperSectionsSheet = ({
  paperId,
  paperTitle,
  open,
  onOpenChange,
}: PaperSectionsSheetProps) => {
  const sectionsQuery = useAssignedSections({
    paperId,
    params: { PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: open && !!paperId },
  });

  const sections = sectionsQuery.data?.result?.items ?? [];
  const totalCount =
    sectionsQuery.data?.result?.paging?.totalCount ?? sections.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Assigned Sections
          </SheetTitle>
          <SheetDescription className="line-clamp-2 text-sm">
            {paperTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {sectionsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : sectionsQuery.isError ? (
            <div className="py-10 text-center">
              <p className="text-destructive text-sm">
                Failed to load sections. Please try again.
              </p>
            </div>
          ) : sections.length === 0 ? (
            <div className="py-10 text-center">
              <Layers className="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-muted-foreground text-sm">
                No sections assigned yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground mb-4 text-sm">
                {totalCount} section{totalCount !== 1 ? 's' : ''} assigned
              </p>
              {sections.map((section, index) => (
                <SectionItem key={section.id} section={section} index={index} />
              ))}
            </div>
          )}

          {sectionsQuery.isFetching && !sectionsQuery.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
