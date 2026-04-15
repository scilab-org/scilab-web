import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { getUserGroups } from '@/lib/auth';
import { usePaperDetail } from '../api/get-paper';
import { UpdatePaper } from './update-paper';
import { DeletePaper } from './delete-paper';
import { formatPublicationDate } from '@/utils/string-utils';
import { PAPER_STATUS_MAP } from '../constants';

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

const getStatusVariant = (
  status: number,
): {
  variant:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'success'
    | 'outline'
    | 'muted';
  className?: string;
} => {
  switch (status) {
    case 1:
      return { variant: 'outline' };
    case 2:
      return { variant: 'default' };
    case 3:
      return { variant: 'secondary' };
    case 4:
      return { variant: 'success' };
    case 5:
      return { variant: 'muted' };
    default:
      return { variant: 'outline' };
  }
};

type DetailField = {
  label: string;
  value: string;
  fullWidth?: boolean;
};

export const PaperView = ({ paperId }: { paperId: string }) => {
  const paperQuery = usePaperDetail({ paperId });
  const isAdmin = getUserGroups().includes('system:admin');

  if (paperQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const paper = paperQuery.data?.result?.paperBank;

  if (!paper) return null;

  const publicationInfo: DetailField[] = [
    { label: 'Journal Name', value: paper.journalName || 'N/A' },
    { label: 'Volume', value: paper.volume || 'N/A' },
    { label: 'Pages', value: paper.pages || 'N/A' },
    {
      label: 'Publication Date',
      value: formatPublicationDate(paper.publicationDate),
    },
    { label: 'DOI', value: paper.doi || 'N/A' },
    { label: 'Conference Name', value: paper.conferenceName || 'N/A' },
    { label: 'Publisher', value: paper.publisher || 'N/A' },
    { label: 'Number', value: paper.number || 'N/A' },
  ];

  const authorAndIdentifiers: DetailField[] = [
    { label: 'Authors', value: paper.authors || 'N/A' },
    { label: 'Paper Type', value: paper.paperType || 'N/A' },
    {
      label: 'Created',
      value: paper.createdOnUtc
        ? new Date(paper.createdOnUtc).toLocaleString()
        : 'N/A',
    },
    {
      label: 'Last Modified',
      value: paper.lastModifiedOnUtc
        ? new Date(paper.lastModifiedOnUtc).toLocaleString()
        : 'N/A',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-xl border py-0 shadow-sm">
        <CardContent className="space-y-6 bg-[#fffaf1] p-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {paper.filePath && (
                  <Button variant="action" asChild>
                    <a
                      href={paper.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </a>
                  </Button>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="action">Tag</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 space-y-2">
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
                      <p className="text-muted-foreground text-sm">No tags.</p>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <UpdatePaper paperId={paperId} paper={paper} />
                  <DeletePaper paperId={paperId} />
                </div>
              )}
            </div>
          </div>

          <div className="bg-border/60 h-px" />

          <div className="bg-card space-y-4 rounded-xl border p-5">
            <h2 className="text-xl font-semibold">Publication Info</h2>
            <div className="grid gap-4 border-t pt-4 md:grid-cols-4">
              {publicationInfo.map((field) => (
                <div key={field.label} className="space-y-1">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    {field.label}
                  </p>
                  <p className="text-foreground text-base font-medium wrap-break-word">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card space-y-4 rounded-xl border p-5 md:col-span-2">
              <h2 className="text-xl font-semibold">Abstract</h2>
              <div className="border-t pt-4">
                <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
                  {paper.abstract || 'No abstract available.'}
                </p>
              </div>
            </div>

            <div className="bg-card space-y-4 rounded-xl border p-5 md:col-span-1">
              <h2 className="text-xl font-semibold">Authors & Identifiers</h2>
              <div className="grid gap-4 border-t pt-4">
                {authorAndIdentifiers.map((field) => (
                  <div
                    key={field.label}
                    className={
                      field.fullWidth ? 'space-y-1 md:col-span-3' : 'space-y-1'
                    }
                  >
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {field.label}
                    </p>
                    <p className="text-foreground text-base font-medium wrap-break-word">
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
