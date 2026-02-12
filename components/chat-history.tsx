"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getChatSessions, type ChatSessionItem } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { MessageSquarePlus, Loader2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function ChatHistoryContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSessionId = pathname === "/chat" ? searchParams.get("session") : null;
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getChatSessions()
      .then((res) => setSessions(res.sessions))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, pathname]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
          Chat history
        </span>
        <Link
          href="/chat"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-accent group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center"
          title="New chat"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">New chat</span>
        </Link>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-4 group-data-[collapsible=icon]:py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="h-[200px] group-data-[collapsible=icon]:h-auto">
          <ul className="space-y-0.5">
            {sessions.length === 0 && (
              <li className="text-xs text-muted-foreground px-2 py-1 group-data-[collapsible=icon]:hidden">
                No conversations yet
              </li>
            )}
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/chat?session=${encodeURIComponent(s.id)}`}
                  className={cn(
                    "flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center",
                    currentSessionId === s.id && "bg-accent"
                  )}
                  title={s.preview}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />
                  <span className="truncate flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    {s.preview}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

export function ChatHistory() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    }>
      <ChatHistoryContent />
    </Suspense>
  );
}
