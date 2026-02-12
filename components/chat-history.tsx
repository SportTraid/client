"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getChatSessions, deleteChatSession, type ChatSessionItem } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { MessageSquarePlus, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CHAT_SESSION_UPDATED_EVENT = "chat-session-updated";

function refetchSessions(setSessions: (s: ChatSessionItem[]) => void, setLoading: (b: boolean) => void) {
  setLoading(true);
  getChatSessions()
    .then((res) => setSessions(res.sessions))
    .catch(() => setSessions([]))
    .finally(() => setLoading(false));
}

export function ChatHistory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSessionId = pathname === "/chat" ? searchParams.get("session") : null;
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSessions = useCallback(() => {
    if (!isAuthenticated) {
      setSessions([]);
      setLoading(false);
      return;
    }
    refetchSessions(setSessions, setLoading);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, pathname]);

  useEffect(() => {
    const handler = () => refetchSessions(setSessions, setLoading);
    window.addEventListener(CHAT_SESSION_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CHAT_SESSION_UPDATED_EVENT, handler);
  }, []);

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
              <li key={s.id} className="group/item flex items-center gap-0.5">
                <Link
                  href={`/chat?session=${encodeURIComponent(s.id)}`}
                  className={cn(
                    "flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent flex-1 min-w-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center",
                    currentSessionId === s.id && "bg-accent"
                  )}
                  title={s.preview}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 group-data-[collapsible=icon]:hidden" />
                  <span className="truncate flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    {s.preview}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover/item:opacity-100 group-data-[collapsible=icon]:opacity-100 text-muted-foreground hover:text-destructive"
                  title="Delete conversation"
                  disabled={deletingId === s.id}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!confirm("Delete this entire conversation?")) return;
                    setDeletingId(s.id);
                    try {
                      await deleteChatSession(s.id);
                      refetchSessions(setSessions, setLoading);
                      if (currentSessionId === s.id) router.push("/chat");
                    } catch {
                      // ignore
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                >
                  {deletingId === s.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
