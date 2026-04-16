import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Loader2, Search, Building2, FileText } from 'lucide-react';

import { CreateButton } from '@/components/ui/create-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useProjectPapers } from '../../api/papers/get-project-papers';
import { ProjectPaper } from '../../types';
import { paths } from '@/config/paths';
import { TagAutocompleteInput } from '@/features/paper-management/components/tag-autocomplete-input';

const TAG_COLORS = [
  'border-border bg-muted text-muted-foreground',
  'border-primary/20 bg-primary/10 text-primary',
  'border-secondary/25 bg-secondary/15 text-secondary',
  'border-tertiary/20 bg-tertiary/10 text-tertiary',
  'border-outline bg-muted/70 text-on-surface-variant',
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

const truncateAuthors = (authors: string | null): React.ReactNode => {
  if (!authors) return <span className="text-muted-foreground text-sm">—</span>;
  const parts = authors
    .split(' and ')
    .map((a) => a.trim())
    .filter(Boolean);
  if (parts.length <= 2) {
    return <span className="text-sm">{parts.join(' & ')}</span>;
  }
  return (
    <span className="text-sm" title={authors}>
      {parts[0]}
      <span className="text-muted-foreground mx-0.5">·</span>
      {parts[parts.length - 1]}
      <span className="text-muted-foreground ml-1 text-xs italic">
        +{parts.length - 2} more
      </span>
    </span>
  );
};

type ProjectPapersListProps = {
  projectId: string;
  getPaperHref?: (projectId: string, paperId: string) => string;
  onAddPapersClick?: () => void;
  onCreatePaperClick?: () => void;
  onRemovePaper?: (paperId: string) => void;
  removingPaperId?: string;
  readOnly?: boolean;
};

export const ProjectPapersList = ({
  projectId,
  getPaperHref,
  onAddPapersClick,
  onCreatePaperClick,
  onRemovePaper,
  removingPaperId,
  readOnly = false,
}: ProjectPapersListProps) => {
  const [titleText, setTitleText] = useState('');
  const [titleDebounce, setTitleDebounce] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [pendingRemovePaperId, setPendingRemovePaperId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const timeout = setTimeout(() => setTitleDebounce(titleText), 300);
    return () => clearTimeout(timeout);
  }, [titleText]);

  const papersQuery = useProjectPapers({
    projectId,
    params: {
      Title: titleDebounce || undefined,
      Tag: tagList.length > 0 ? tagList : undefined,
    },
  });

  const papers: ProjectPaper[] = (papersQuery.data as any)?.result?.items ?? [];
  const totalCount: number =
    (papersQuery.data as any)?.result?.paging?.totalCount ?? papers.length;

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-border bg-empty-state border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              References
            </h2>
            {!papersQuery.isLoading && (
              <p className="text-muted-foreground mt-1 text-sm">
                {totalCount} reference{totalCount !== 1 ? 's' : ''} in this
                project
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!!onCreatePaperClick && (
              <CreateButton
                onClick={onCreatePaperClick}
                size="sm"
                className="flex items-center gap-2"
                label="Add Paper"
              />
            )}
            {!readOnly && !!onAddPapersClick && (
              <CreateButton
                onClick={onAddPapersClick}
                size="sm"
                className="flex items-center gap-2"
                label="Add References"
              />
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by title..."
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="pl-10"
            />
          </div>
          <div className="flex-1">
            <TagAutocompleteInput
              tagList={tagList}
              onAddTag={(tag) =>
                setTagList((prev) =>
                  prev.includes(tag) ? prev : [...prev, tag],
                )
              }
              onRemoveTag={(tag) =>
                setTagList((prev) => prev.filter((t) => t !== tag))
              }
              placeholder="Type a tag and press Enter..."
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div>
        {papersQuery.isLoading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : papers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[4%] px-2 text-center font-semibold">
                    #
                  </TableHead>
                  <TableHead className="w-[15%] px-2 font-semibold">
                    DOI
                  </TableHead>
                  <TableHead className="w-[25%] px-2 font-semibold">
                    Title
                  </TableHead>
                  <TableHead className="w-[15%] px-2 font-semibold">
                    Authors
                  </TableHead>
                  <TableHead className="w-[15%] px-2 font-semibold">
                    Journal / Conference
                  </TableHead>
                  <TableHead className="w-[8%] px-2 text-center font-semibold">
                    Tags
                  </TableHead>
                  <TableHead className="w-[18%] px-2 text-center font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper, index) => (
                  <TableRow
                    key={paper.id}
                    className={`hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    {/* # */}
                    <TableCell className="text-muted-foreground px-2 text-center text-xs">
                      {index + 1}
                    </TableCell>

                    {/* DOI */}
                    <TableCell className="px-2 break-all whitespace-normal">
                      {paper.doi ? (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground text-sm hover:underline"
                          title={paper.doi}
                        >
                          {paper.doi}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          N/A
                        </span>
                      )}
                    </TableCell>

                    {/* Title */}
                    <TableCell className="px-2 break-words whitespace-normal">
                      <Link
                        to={
                          getPaperHref
                            ? getPaperHref(projectId, paper.id)
                            : paths.app.paperManagement.paper.getHref(paper.id)
                        }
                        className="text-foreground hover:underline"
                        title={paper.title || '(Untitled)'}
                      >
                        {paper.title || '(Untitled)'}
                      </Link>
                    </TableCell>

                    {/* Authors */}
                    <TableCell className="px-2 break-words whitespace-normal">
                      {truncateAuthors(paper.authors)}
                    </TableCell>

                    {/* Venue */}
                    <TableCell className="px-2 break-words whitespace-normal">
                      {paper.journalName ? (
                        <span className="line-clamp-2 text-sm">
                          {paper.journalName}
                        </span>
                      ) : paper.conferenceName ? (
                        <span className="flex items-start gap-1.5 text-sm">
                          <Building2 className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                          <span className="line-clamp-2">
                            {paper.conferenceName}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          —
                        </span>
                      )}
                    </TableCell>

                    {/* Status removed */}
                    {/* Tags */}
                    <TableCell className="px-2 text-center whitespace-normal">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="action" size="xs">
                            Tag
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-64 space-y-2"
                        >
                          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                            Tags ({paper.tagNames?.length || 0})
                          </p>
                          {paper.tagNames && paper.tagNames.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {paper.tagNames.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className={`px-2.5 py-1 text-xs font-medium ${getTagColor(tag)}`}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              No tags.
                            </p>
                          )}
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {paper.filePath && (
                          <Button
                            variant="action"
                            size="icon"
                            asChild
                            className="size-8"
                            title="Download"
                          >
                            <a
                              href={paper.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                            >
                              <FileText className="size-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outlineAction"
                          size="action"
                          asChild
                          title="View Paper"
                        >
                          <Link
                            to={
                              getPaperHref
                                ? getPaperHref(projectId, paper.id)
                                : paths.app.paperManagement.paper.getHref(
                                    paper.id,
                                  )
                            }
                          >
                            VIEW
                          </Link>
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="destructive"
                            size="action"
                            onClick={() => setPendingRemovePaperId(paper.id)}
                            disabled={removingPaperId === paper.id}
                            title="Remove Paper"
                          >
                            {removingPaperId === paper.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            REMOVE
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : titleDebounce || tagList.length > 0 ? (
          <div className="bg-empty-state rounded-b-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No papers found matching the current filters
            </p>
          </div>
        ) : (
          <div className="bg-empty-state rounded-b-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">No papers added yet</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Use the buttons above to add or create papers in this project
            </p>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!pendingRemovePaperId}
        onOpenChange={(open) => !open && setPendingRemovePaperId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Paper</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this paper from the project? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingRemovePaperId) {
                  (onRemovePaper ?? (() => {}))(pendingRemovePaperId);
                  setPendingRemovePaperId(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
