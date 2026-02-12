"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sendChatMessageStream, getSessionMessages } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Send, Loader2, Square } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [loadingState, setLoadingState] = useState<"thinking" | "analysing" | "responding">("thinking");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // Set session id and load messages when session param changes
  useEffect(() => {
    if (!isAuthenticated) return;
    if (sessionParam) {
      setChatSessionId(sessionParam);
      setSessionLoadError(null);
      getSessionMessages(sessionParam)
        .then((r) => {
          setMessages(
            r.messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        })
        .catch(() => {
          setSessionLoadError("Could not load conversation.");
          setMessages([]);
        });
    } else {
      setChatSessionId(crypto.randomUUID());
      setMessages([]);
      setSessionLoadError(null);
    }
  }, [sessionParam, isAuthenticated]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, currentResponse]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !chatSessionId) return;

    const userMessage = input.trim();
    setInput("");
    setCurrentResponse("");

    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setLoadingState("thinking");

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = crypto.randomUUID();
    let fullResponse = "";

    try {
      await sendChatMessageStream(
        {
          user_message: userMessage,
          chatsession_id: chatSessionId,
          request_id: requestId,
        },
        (chunk: string) => {
          fullResponse += chunk;
          setCurrentResponse(fullResponse);
          if (loadingState === "thinking") setLoadingState("responding");
        },
        { signal: controller.signal }
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullResponse },
      ]);
      setCurrentResponse("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("chat-session-updated"));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const isAbort = error instanceof Error && error.name === "AbortError";
      if (isAbort) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: fullResponse.trim() || "Response stopped.",
          },
        ]);
        setCurrentResponse("");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("chat-session-updated"));
        }
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Sorry, I encountered an error. Please try again.";
        if (errorMessage.toLowerCase().includes("unauthorized")) {
          logout();
          router.replace("/login");
          return;
        }
        const isQuotaError =
          errorMessage.toLowerCase().includes("quota") ||
          errorMessage.toLowerCase().includes("429");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: isQuotaError
              ? "I've reached my daily API limit. Please try again tomorrow or contact support if you need immediate assistance."
              : `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          },
        ]);
        setCurrentResponse("");
      }
    } finally {
      setIsLoading(false);
      setLoadingState("thinking");
      abortControllerRef.current = null;
    }
  }, [input, isLoading, chatSessionId, loadingState, logout, router]);

  const handleStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col -m-4">
      {sessionLoadError && (
        <p className="text-sm text-destructive px-4 py-2">{sessionLoadError}</p>
      )}
      {messages.length === 0 && !sessionLoadError ? (
        <>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-semibold mb-3">Welcome to Triad</h1>
                <p className="text-lg text-muted-foreground">
                  Your personal sports psychology assistant is here to help you achieve your goals.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card
                  className="p-6 hover:bg-accent transition-colors cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => setInput("How can I improve my mental preparation before games?")}
                >
                  <h3 className="font-semibold mb-2">Mental Preparation</h3>
                  <p className="text-sm text-muted-foreground">
                    Get strategies for pre-game focus and confidence building
                  </p>
                </Card>
                <Card
                  className="p-6 hover:bg-accent transition-colors cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => setInput("I'm feeling anxious before competitions. How can I manage this?")}
                >
                  <h3 className="font-semibold mb-2">Performance Anxiety</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn techniques to manage stress and perform under pressure
                  </p>
                </Card>
                <Card
                  className="p-6 hover:bg-accent transition-colors cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => setInput("Help me set effective goals for my athletic performance")}
                >
                  <h3 className="font-semibold mb-2">Goal Setting</h3>
                  <p className="text-sm text-muted-foreground">
                    Create actionable plans to reach your athletic objectives
                  </p>
                </Card>
                <Card
                  className="p-6 hover:bg-accent transition-colors cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => setInput("How can I maintain balance and prevent burnout?")}
                >
                  <h3 className="font-semibold mb-2">Recovery & Balance</h3>
                  <p className="text-sm text-muted-foreground">
                    Maintain mental wellness and prevent burnout
                  </p>
                </Card>
              </div>
            </div>
          </div>
          <div className="bg-background px-4 py-4 shrink-0">
            <div className="mx-auto max-w-2xl flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about sports psychology..."
                disabled={isLoading}
                className="flex-1 h-14 text-base"
              />
              {isLoading ? (
                <Button onClick={handleStop} size="lg" variant="outline" className="h-14 px-6">
                  <Square className="h-5 w-5" />
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!input.trim()} size="lg" className="h-14 px-6">
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <ScrollArea className="flex-1 min-h-0 p-4">
            <div className="mx-auto max-w-3xl space-y-4 pb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>T</AvatarFallback>
                    </Avatar>
                  )}
                  <Card
                    className={`max-w-[80%] p-4 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </Card>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>T</AvatarFallback>
                  </Avatar>
                  <Card className="max-w-[80%] p-4 bg-muted">
                    {currentResponse ? (
                      <>
                        <p className="whitespace-pre-wrap">{currentResponse}</p>
                        <Loader2 className="h-4 w-4 animate-spin mt-2" />
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-muted-foreground">
                          {loadingState === "thinking" && "Thinking..."}
                          {loadingState === "analysing" && "Analysing..."}
                          {loadingState === "responding" && "Responding..."}
                        </p>
                      </div>
                    )}
                  </Card>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          <div className="bg-background px-4 py-4 shrink-0">
            <div className="mx-auto max-w-3xl flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 h-12 text-base"
              />
              {isLoading ? (
                <Button onClick={handleStop} variant="outline" className="h-12">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!input.trim()} className="h-12">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
