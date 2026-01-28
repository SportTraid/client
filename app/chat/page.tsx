"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sendChatMessageStream, type ChatRequest } from "@/lib/api";
import { Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatSessionId, setChatSessionId] = useState<string | undefined>();

  // Mock user data - replace with actual user data from auth later
  const userData = {
    user_id: 1,
    username: "testuser",
    role: "player",
    age: 25,
    gender: "male",
    first_name: "Test",
    last_name: "User",
    organization: "Test Org",
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, currentResponse]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setCurrentResponse("");

    // Add user message
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const chatRequest: ChatRequest = {
        ...userData,
        user_message: userMessage,
        chatsession_id: chatSessionId,
      };

      let fullResponse = "";

      await sendChatMessageStream(chatRequest, (chunk: string) => {
        fullResponse += chunk;
        setCurrentResponse(fullResponse);
      });

      // Add assistant message after streaming completes
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fullResponse,
        },
      ]);
      setCurrentResponse("");
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Sorry, I encountered an error. Please try again.";
      
      // Check if it's a quota error
      const isQuotaError = errorMessage.toLowerCase().includes("quota") || 
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Welcome to Triad Chat</h2>
                <p className="text-muted-foreground">
                  Start a conversation with your sports psychology assistant
                </p>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </Card>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && currentResponse && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <Card className="max-w-[80%] p-4 bg-muted">
                <p className="whitespace-pre-wrap">{currentResponse}</p>
                <Loader2 className="h-4 w-4 animate-spin mt-2" />
              </Card>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

