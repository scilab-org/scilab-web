import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  PanelRightOpen,
  PanelRightClose,
  MessageSquare,
} from 'lucide-react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';

import { useProjectDetail } from '@/features/project-management/api/projects/get-project';
import { useSessions } from '../api/get-sessions';
import { useSendMessage } from '../api/send-message';
import { ChatSessionSidebar } from './chat-session-sidebar';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';
import { cn } from '@/utils/cn';

export const AIChatPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const projectQuery = useProjectDetail({
    projectId: projectId!,
    queryConfig: { enabled: !!projectId },
  });

  const sessionsQuery = useSessions({
    projectId: projectId!,
    queryConfig: { enabled: !!projectId },
  });

  const sendMessageMutation = useSendMessage({
    mutationConfig: {
      onSuccess: (data) => {
        // If a new session was created, select it
        if (!activeSessionId) {
          setActiveSessionId(data.sessionId);
        }
        setRefreshKey((k) => k + 1);
      },
    },
  });

  const projectName = projectQuery.data?.result?.project?.name ?? 'Project';

  const activeSession = sessionsQuery.data?.sessions.find(
    (s) => s.id === activeSessionId,
  );

  const handleSend = useCallback(
    (content: string) => {
      if (!projectId) return;
      sendMessageMutation.mutate({
        sessionId: activeSessionId ?? undefined,
        projectId,
        content,
      });
    },
    [projectId, activeSessionId, sendMessageMutation],
  );

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleBack = () => {
    navigate(paths.app.assignedProjects.detail.getHref(projectId!));
  };

  if (!projectId) return null;

  return (
    <>
      <Head title={`AI Research — ${projectName}`} />
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Top bar */}
        <div className="border-border bg-background flex h-12 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Back to project"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-primary text-[10px] font-semibold tracking-wider uppercase">
                {activeSessionId ? 'Active Session' : 'New Session'}
              </span>
              <span className="text-foreground max-w-md truncate text-sm leading-tight font-medium">
                {activeSession?.title ?? 'Start a new conversation'}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen((o) => !o)}
            className="gap-2"
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Sessions</span>
          </Button>
        </div>

        {/* Main area */}
        <div className="flex min-h-0 flex-1">
          {/* Chat area */}
          <div className="flex min-w-0 flex-1 flex-col">
            {activeSessionId ? (
              <ChatMessageList
                sessionId={activeSessionId}
                refreshKey={refreshKey}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
                <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                  <MessageSquare className="text-primary h-8 w-8" />
                </div>
                <div className="text-center">
                  <h2 className="text-foreground text-lg font-semibold">
                    AI Research Assistant
                  </h2>
                  <p className="text-muted-foreground mt-1 max-w-md text-sm">
                    Start a conversation to research topics related to{' '}
                    <span className="font-medium">{projectName}</span>. Your
                    first message will create a new session.
                  </p>
                </div>
              </div>
            )}

            <ChatInput
              onSend={handleSend}
              isSending={sendMessageMutation.isPending}
              isSessionActive={!!activeSessionId}
            />
          </div>

          {/* Right sidebar */}
          <div
            className={cn(
              'border-border shrink-0 overflow-hidden border-l transition-all duration-300 ease-in-out',
              sidebarOpen ? 'w-80' : 'w-0 border-l-0',
            )}
          >
            <div className="h-full w-80">
              <ChatSessionSidebar
                projectId={projectId}
                projectName={projectName}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
