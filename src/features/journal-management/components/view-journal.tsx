import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { JournalDto } from '../types';

type ViewJournalProps = {
  journal: JournalDto;
};

export const ViewJournal = ({ journal }: ViewJournalProps) => {
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Journal Basic Info */}
      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="text-muted-foreground text-sm font-medium">
            Journal Name
          </h3>
          <p className="mt-1 text-lg font-semibold">{journal.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium">
              Created
            </h3>
            <p className="mt-1 text-sm">
              {journal.createdOnUtc
                ? new Date(journal.createdOnUtc).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-muted-foreground text-sm font-medium">
              Last Modified
            </h3>
            <p className="mt-1 text-sm">
              {journal.lastModifiedOnUtc
                ? new Date(journal.lastModifiedOnUtc).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-muted-foreground text-sm font-medium">
            Total Styles
          </h3>
          <p className="mt-1 text-sm">
            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {journal.styles?.length ?? 0}
            </span>
          </p>
        </div>
      </div>

      {/* Writing Styles */}
      {journal.styles && journal.styles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Writing Styles</h3>
          <div className="overflow-x-auto rounded-lg border">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-slate-950/50">
                  <TableHead className="font-semibold" />
                  <TableHead className="font-semibold">Style Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journal.styles.map((style, idx) => (
                  <React.Fragment key={idx}>
                    <TableRow>
                      <TableCell className="w-8">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedIdx(expandedIdx === idx ? null : idx)
                          }
                          className="rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {expandedIdx === idx ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {style.name}
                      </TableCell>
                    </TableRow>
                    {expandedIdx === idx && (
                      <TableRow className="bg-slate-50/50 dark:bg-slate-950/20">
                        <TableCell colSpan={2} className="p-3">
                          <div className="space-y-3 text-xs">
                            {style.description && (
                              <div>
                                <p className="font-semibold">Description:</p>
                                <p className="text-muted-foreground mt-1">
                                  {style.description}
                                </p>
                              </div>
                            )}
                            {style.rule && (
                              <div>
                                <p className="font-semibold">Rule:</p>
                                <pre className="bg-background overflow-auto rounded border p-2 font-sans text-xs">
                                  {style.rule}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {(!journal.styles || journal.styles.length === 0) && (
        <div className="flex h-32 w-full items-center justify-center rounded-lg border">
          <p className="text-muted-foreground">No writing styles defined.</p>
        </div>
      )}
    </div>
  );
};
