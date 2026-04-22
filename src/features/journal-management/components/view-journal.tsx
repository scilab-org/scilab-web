import * as React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { paths } from '@/config/paths';

import { JournalDto, PaperRef, ProjectRef } from '../types';
import { UpdateJournal } from './update-journal';
import { DeleteJournal } from './delete-journal';

type ViewJournalProps = {
  journal: JournalDto;
  projects?: ProjectRef[];
  papers?: PaperRef[];
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : 'N/A';

type DetailField = {
  label: string;
  value: React.ReactNode;
};

const JOURNAL_TYPE_LABEL: Record<number, string> = {
  1: 'Journal',
  2: 'Conference',
};

export const ViewJournal = ({
  journal,
  projects,
  papers,
}: ViewJournalProps) => {
  const journalMain: DetailField[] = [
    {
      label: 'Type',
      value:
        journal.type != null
          ? (JOURNAL_TYPE_LABEL[journal.type] ?? String(journal.type))
          : 'N/A',
    },
    { label: 'ISSN', value: journal.issn || 'N/A' },
    { label: 'Ranking', value: journal.ranking || 'N/A' },
  ];

  const journalAudit: DetailField[] = [
    { label: 'Created By', value: journal.createdBy || 'N/A' },
    { label: 'Created Date', value: fmt(journal.createdOnUtc) },
    { label: 'Last Modified By', value: journal.lastModifiedBy || 'N/A' },
    { label: 'Last Modified Date', value: fmt(journal.lastModifiedOnUtc) },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-md border py-0 shadow-sm">
        <CardContent className="space-y-6 bg-[#fffaf1] p-6">
          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {journal.url && (
                <Button variant="action" asChild>
                  <a
                    href={journal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Origin Info
                  </a>
                </Button>
              )}
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
            <div className="grid gap-4 border-t pt-4 md:grid-cols-2 xl:grid-cols-4">
              {journalMain.map((field) => (
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
            <div className="grid gap-4 border-t pt-4 md:grid-cols-2 xl:grid-cols-4">
              {journalAudit.map((field) => (
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

          {/* Associated Templates */}
          <div className="bg-card space-y-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">Associated Templates</h2>
            <div className="border-t pt-4">
              {journal.templates && journal.templates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {journal.templates.map((t) => (
                    <a
                      key={t.id}
                      href={paths.app.paperTemplateManagement.paperTemplate.getHref(
                        t.id,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-muted text-foreground hover:bg-muted/70 rounded-md border px-3 py-1 font-mono text-sm font-medium transition-colors"
                    >
                      {t.code}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-base">
                  No associated templates.
                </p>
              )}
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

          <div className="bg-card space-y-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">Associated Papers</h2>
            <div className="border-t pt-4">
              {papers && papers.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-muted-foreground pb-3 text-left text-xs font-semibold tracking-wider uppercase">
                        Title
                      </th>
                      <th className="text-muted-foreground pb-3 text-left text-xs font-semibold tracking-wider uppercase">
                        Start Date
                      </th>
                      <th className="text-muted-foreground pb-3 text-left text-xs font-semibold tracking-wider uppercase">
                        End Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {papers.map((paper) => (
                      <tr key={paper.id}>
                        <td className="text-foreground py-2.5 text-base font-medium">
                          {paper.title}
                        </td>
                        <td className="text-foreground py-2.5 text-sm font-medium">
                          {fmt(paper.conferenceJournalStartAt)}
                        </td>
                        <td className="text-foreground py-2.5 text-sm font-medium">
                          {fmt(paper.conferenceJournalEndAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground text-base">
                  No associated papers.
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
