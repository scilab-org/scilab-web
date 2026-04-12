import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Trash2, Loader2, Search, Plus, Download, Tags } from 'lucide-react';

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

import { BTN } from '@/lib/button-styles';
import { useProjectPapers } from '../../api/papers/get-project-papers';
import { ProjectPaper } from '../../types';
import { paths } from '@/config/paths';
import { PAPER_STATUS_MAP } from '@/features/paper-management/constants';
import { TagAutocompleteInput } from '@/features/paper-management/components/tag-autocomplete-input';
import { formatPublicationDate } from '@/utils/string-utils';

const getStatusColor = (status: number | null) => {
  switch (status) {
    case 1: // Draft
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    case 4: // Released
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    case 5: // Sampled
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

const TAG_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
  'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800',
  'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800',
  'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
  'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
  'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800',
  'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
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

  return (
    <div className="border-border rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-border bg-muted/30 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              References
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!!onCreatePaperClick && (
              <Button
                onClick={onCreatePaperClick}
                size="sm"
                className="btn-create flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Paper
              </Button>
            )}
            {!readOnly && !!onAddPapersClick && (
              <Button
                onClick={onAddPapersClick}
                size="sm"
                className="btn-create flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add References
              </Button>
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
                <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <TableHead className="w-[20%] font-semibold text-green-900 dark:text-green-200">
                    Title
                  </TableHead>
                  <TableHead className="w-[15%] font-semibold text-green-900 dark:text-green-200">
                    Authors
                  </TableHead>
                  <TableHead className="w-[10%] font-semibold text-green-900 dark:text-green-200">
                    Status
                  </TableHead>
                  <TableHead className="w-[10%] font-semibold text-green-900 dark:text-green-200">
                    DOI
                  </TableHead>
                  <TableHead className="w-[15%] font-semibold text-green-900 dark:text-green-200">
                    Journal / Conference
                  </TableHead>
                  <TableHead className="w-[10%] font-semibold text-green-900 dark:text-green-200">
                    Published
                  </TableHead>
                  <TableHead className="w-[10%] font-semibold text-green-900 dark:text-green-200">
                    Tags
                  </TableHead>
                  <TableHead className="w-[10%] text-right font-semibold text-green-900 dark:text-green-200">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper, index) => (
                  <TableRow
                    key={paper.id}
                    className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20 ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}
                  >
                    <TableCell className="overflow-hidden font-medium">
                      <Link
                        to={
                          getPaperHref
                            ? getPaperHref(projectId, paper.id)
                            : paths.app.paperManagement.paper.getHref(paper.id)
                        }
                        className="block truncate text-blue-600 hover:underline dark:text-blue-400"
                        title={paper.title || '(Untitled)'}
                      >
                        {paper.title || '(Untitled)'}
                      </Link>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground truncate text-sm"
                      title={paper.authors || ''}
                    >
                      {paper.authors || '—'}
                    </TableCell>
                    <TableCell>
                      {paper.status != null ? (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(paper.status)}`}
                        >
                          {PAPER_STATUS_MAP[paper.status] ?? 'Unknown'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground truncate text-sm"
                      title={paper.doi || ''}
                    >
                      {paper.doi || '—'}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground truncate text-sm"
                      title={paper.journalName || paper.conferenceName || ''}
                    >
                      {paper.journalName || paper.conferenceName || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {paper.publicationDate
                        ? formatPublicationDate(paper.publicationDate)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {paper.tagNames && paper.tagNames.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="xs"
                              className="gap-1 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                            >
                              <Tags className="size-3" />
                              {paper.tagNames.length} tags
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-64">
                            <p className="mb-2 text-sm font-medium">Tags</p>
                            <div className="flex flex-wrap gap-1.5">
                              {paper.tagNames.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className={`text-xs ${getTagColor(tag)}`}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs italic">
                          <Tags className="size-3 opacity-40" />
                          No tags
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {paper.filePath && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className={`h-8 w-8 p-0 ${BTN.VIEW_OUTLINE}`}
                            title="Download"
                          >
                            <a
                              href={paper.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {!readOnly && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setPendingRemovePaperId(paper.id)}
                            disabled={removingPaperId === paper.id}
                            className={`h-8 w-8 p-0 ${BTN.DANGER}`}
                            title="Remove Paper"
                          >
                            {removingPaperId === paper.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
          <div className="bg-muted/30 rounded-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No papers found matching the current filters
            </p>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg py-12 text-center">
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
