import * as React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { JournalDto, ProjectRef } from '../types';
import { UpdateJournal } from './update-journal';
import { DeleteJournal } from './delete-journal';

type ViewJournalProps = {
  journal: JournalDto;
  projects?: ProjectRef[];
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : 'N/A';

type DetailField = {
  label: string;
  value: React.ReactNode;
};

export const ViewJournal = ({ journal, projects }: ViewJournalProps) => {
  const journalInfo: DetailField[] = [
    { label: 'Structure', value: journal.templateCode || 'N/A' },
    { label: 'Start Date', value: fmt(journal.startAt) },
    { label: 'End Date', value: fmt(journal.endAt) },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-md border py-0 shadow-sm">
        <CardContent className="space-y-6 bg-[#fffaf1] p-6">
          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {journal.texFile && (
                <Button variant="action" asChild>
                  <a
                    href={journal.texFile}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View TeX
                  </a>
                </Button>
              )}
              {journal.pdfFile && (
                <Button variant="action" asChild>
                  <a
                    href={journal.pdfFile}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View PDF
                  </a>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <UpdateJournal journalId={journal.id} journal={journal} />
              <DeleteJournal journalId={journal.id} />
            </div>
          </div>

          <div className="bg-border/60 h-px" />

          {/* Journal Info card */}
          <div className="bg-card space-y-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">Journal Info</h2>
            <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
              {journalInfo.map((field) => (
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

          {/* Associated Projects */}
          <div className="bg-card space-y-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">Associated Projects</h2>
            <div className="border-t pt-4">
              {projects && projects.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-muted-foreground pb-3 text-left text-xs font-semibold tracking-wider uppercase">
                        Name
                      </th>
                      <th className="text-muted-foreground pb-3 text-left text-xs font-semibold tracking-wider uppercase">
                        Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td className="text-foreground py-2.5 text-base font-medium">
                          {p.name}
                        </td>
                        <td className="text-foreground py-2.5 font-mono text-sm font-medium">
                          {p.code}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground text-base">
                  No associated projects.
                </p>
              )}
            </div>
          </div>

          {/* Style */}
          <div className="bg-card space-y-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">Style</h2>
            <div className="border-t pt-4">
              <p className="text-foreground text-base font-medium">
                {journal.style || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
