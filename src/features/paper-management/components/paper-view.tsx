import {
  FileText,
  BookOpen,
  Calendar,
  Hash,
  Globe,
  Building2,
  Presentation,
  Clock,
  RefreshCw,
  Database,
  Tags,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { getUserGroups } from '@/lib/auth';
import { usePaperDetail } from '../api/get-paper';
import { UpdatePaper } from './update-paper';
import { DeletePaper } from './delete-paper';
import { formatPublicationDate } from '@/utils/stringUtils';
import { PAPER_STATUS_MAP } from '../constants';

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

const getStatusVariant = (
  status: number,
): {
  variant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline';
  className?: string;
} => {
  switch (status) {
    case 1:
      return {
        variant: 'outline',
        className:
          'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300',
      };
    case 2:
      return {
        variant: 'default',
        className:
          'bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-200 dark:shadow-blue-900/30',
      };
    case 3:
      return {
        variant: 'default',
        className:
          'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200 dark:shadow-amber-900/30',
      };
    case 4:
      return {
        variant: 'default',
        className:
          'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30',
      };
    case 5:
      return {
        variant: 'default',
        className:
          'bg-purple-500 text-white hover:bg-purple-600 shadow-sm shadow-purple-200 dark:shadow-purple-900/30',
      };
    default:
      return { variant: 'outline' };
  }
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

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-card flex items-center justify-between rounded-xl border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Badge
            variant={getStatusVariant(paper.status).variant}
            className={`px-3 py-1 text-sm ${getStatusVariant(paper.status).className}`}
          >
            {PAPER_STATUS_MAP[paper.status] || 'Unknown'}
          </Badge>
          {paper.filePath && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <a
                href={paper.filePath}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="size-4" />
                View PDF
              </a>
            </Button>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <UpdatePaper paperId={paperId} paper={paper} />
            <DeletePaper paperId={paperId} />
          </div>
        )}
      </div>

      {/* Paper Info & Publication Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <CardHeader className="bg-muted/30 border-b px-6 py-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <BookOpen className="text-muted-foreground size-5" />
              Paper Information
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Basic paper details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <div className="bg-muted/50 mt-0.5 rounded-lg border p-2">
                <BookOpen className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Title
                </p>
                <p className="text-foreground font-medium">
                  {paper.title || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-muted/50 mt-0.5 rounded-lg border p-2">
                <Hash className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  DOI
                </p>
                <p className="text-foreground font-medium">
                  {paper.doi || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-muted/50 mt-0.5 rounded-lg border p-2">
                <FileText className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Paper Type
                </p>
                <p className="text-foreground font-medium">
                  {paper.paperType || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-muted/50 mt-0.5 rounded-lg border p-2">
                <Calendar className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Publication Date
                </p>
                <p className="text-foreground font-medium">
                  {formatPublicationDate(paper.publicationDate)}
                </p>
              </div>
            </div>
            <div className="flex gap-4 pt-1">
              <div className="flex items-center gap-2">
                <div className="bg-muted/50 rounded-lg border p-2">
                  <Database className="text-muted-foreground size-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Ingest
                  </p>
                  <Badge
                    variant={paper.isIngested ? 'default' : 'outline'}
                    className={
                      paper.isIngested
                        ? 'bg-teal-500 text-white'
                        : 'border-slate-300 text-slate-500'
                    }
                  >
                    {paper.isIngested ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-muted/50 rounded-lg border p-2">
                  <Sparkles className="text-muted-foreground size-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Auto Tag
                  </p>
                  <Badge
                    variant={paper.isAutoTagged ? 'default' : 'outline'}
                    className={
                      paper.isAutoTagged
                        ? 'bg-amber-500 text-white'
                        : 'border-slate-300 text-slate-500'
                    }
                  >
                    {paper.isAutoTagged ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <CardHeader className="bg-muted/30 border-b px-6 py-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Globe className="text-muted-foreground size-5" />
              Publication Details
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Journal and conference information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <div className="bg-muted/50 mt-0.5 rounded-lg border p-2">
                <Building2 className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Journal Name
                </p>
                <p className="text-foreground font-medium">
                  {paper.journalName || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-muted/50 mt-0.5 rounded-lg border p-2">
                <Presentation className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Conference Name
                </p>
                <p className="text-foreground font-medium">
                  {paper.conferenceName || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-muted/50 mt-0.5 rounded-lg border p-2">
                <Clock className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Created
                </p>
                <p className="text-foreground font-medium">
                  {paper.createdOnUtc
                    ? new Date(paper.createdOnUtc).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-muted/50 mt-0.5 rounded-lg border p-2">
                <RefreshCw className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Last Modified
                </p>
                <p className="text-foreground font-medium">
                  {paper.lastModifiedOnUtc
                    ? new Date(paper.lastModifiedOnUtc).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags & Abstract */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <CardHeader className="bg-muted/30 border-b px-6 py-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Tags className="text-muted-foreground size-5" />
              Tags
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Associated tags ({paper.tagNames?.length || 0})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>

        <Card className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <CardHeader className="bg-muted/30 border-b px-6 py-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <BookOpen className="text-muted-foreground size-5" />
              Abstract
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Paper abstract
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {paper.abstract || 'No abstract available.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
