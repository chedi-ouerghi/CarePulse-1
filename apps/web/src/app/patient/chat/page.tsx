"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import {
  Send,
  MessageCircle,
  Plus,
  Loader2,
  Bot,
  User,
  ChevronRight,
  Sparkles,
  Clock,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const SUGGESTIONS = [
  "What's my average glucose this week?",
  "Any patterns in my readings?",
  "How is my time in range?",
  "Tips for improving my levels?",
];

export default function PatientChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversationsQuery = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => queries.chat.getConversations(user!.id),
    enabled: !!user,
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: () => queries.chat.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
  });

  const sendMutation = useMutation({
    mutationFn: ({
      content,
      conversationId,
    }: {
      content: string;
      conversationId?: string;
    }) => queries.chat.send(user!.id, content, conversationId),
    onSuccess: (data) => {
      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
        queryClient.invalidateQueries({
          queryKey: ["conversations", user?.id],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["messages", activeConversationId || data.conversationId],
      });
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesQuery.data, scrollToBottom]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate({
      content: trimmed,
      conversationId: activeConversationId || undefined,
    });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages: Message[] = messagesQuery.data || [];
  const conversations: Conversation[] = conversationsQuery.data || [];
  const hasActiveChat = !!activeConversationId;

  const handleNewChat = () => {
    setActiveConversationId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex h-full bg-[#fafafa]">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#0a0a0b]">
            Conversations
          </h2>
          <button
            onClick={handleNewChat}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#525252] transition-colors"
            title="New conversation"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-[#a3a3a3]" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[#d4d4d4]" />
              <p className="text-xs text-[#a3a3a3]">No conversations yet.</p>
              <p className="text-xs text-[#d4d4d4]">
                Start a new chat below.
              </p>
            </div>
          ) : (
            <div className="py-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                    activeConversationId === conv.id
                      ? "bg-[#f5f5f5]"
                      : "hover:bg-[#fafafa]"
                  }`}
                >
                  <MessageCircle
                    className={`h-4 w-4 shrink-0 ${
                      activeConversationId === conv.id
                        ? "text-[#2563eb]"
                        : "text-[#a3a3a3]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        activeConversationId === conv.id
                          ? "font-medium text-[#0a0a0b]"
                          : "text-[#525252]"
                      }`}
                    >
                      {conv.title || "New conversation"}
                    </p>
                    <p className="text-[11px] text-[#a3a3a3]">
                      {new Date(
                        conv.updatedAt || conv.createdAt
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-3 w-3 shrink-0 text-[#d4d4d4]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {!hasActiveChat ? (
            <div className="flex h-full flex-col items-center justify-center px-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff]">
                <Sparkles className="h-6 w-6 text-[#2563eb]" />
              </div>
              <h3 className="mb-1 text-lg font-semibold tracking-tight text-[#0a0a0b]">
                AI Health Assistant
              </h3>
              <p className="mb-6 max-w-sm text-center text-sm text-[#737373]">
                Ask me anything about your glucose data, patterns, or diabetes
                management.
              </p>
              <div className="grid w-full max-w-lg grid-cols-2 gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="rounded-xl border border-[#e5e5e5] bg-white px-3.5 py-3 text-left text-sm text-[#525252] transition-all duration-150 hover:border-[#bfdbfe] hover:bg-[#eff6ff] hover:text-[#2563eb] hover:shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : messagesQuery.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#a3a3a3]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <MessageCircle className="mb-2 h-8 w-8 text-[#d4d4d4]" />
              <p className="text-sm text-[#a3a3a3]">
                Send a message to start the conversation.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } animate-slideUp`}
                  style={{ animationDelay: `${Math.min(idx * 20, 200)}ms` }}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] ring-1 ring-[#bfdbfe]">
                      <Bot className="h-4 w-4 text-[#2563eb]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] ${
                      msg.role === "user"
                        ? "rounded-2xl rounded-br-md bg-[#2563eb] px-4 py-3 text-white shadow-sm"
                        : "rounded-2xl rounded-bl-md border border-[#e5e5e5] bg-white px-4 py-3 text-[#0a0a0b] shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    <div
                      className={`mt-1.5 flex items-center gap-1 ${
                        msg.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <Clock
                        className={`h-3 w-3 ${
                          msg.role === "user"
                            ? "text-[#93c5fd]"
                            : "text-[#d4d4d4]"
                        }`}
                      />
                      <span
                        className={`text-[10px] ${
                          msg.role === "user"
                            ? "text-[#93c5fd]"
                            : "text-[#a3a3a3]"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5] ring-1 ring-[#e5e5e5]">
                      <User className="h-4 w-4 text-[#525252]" />
                    </div>
                  )}
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex gap-3 animate-fadeIn">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] ring-1 ring-[#bfdbfe]">
                    <Bot className="h-4 w-4 text-[#2563eb]" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md border border-[#e5e5e5] bg-white px-5 py-3.5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#a3a3a3] [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#a3a3a3] [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#a3a3a3]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#e5e5e5] bg-white p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasActiveChat
                  ? "Type your message..."
                  : "Ask about your health data..."
              }
              disabled={sendMutation.isPending}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-4 py-3 text-sm text-[#0a0a0b] placeholder-[#a3a3a3] transition-all duration-150 focus:border-[#2563eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 disabled:opacity-50"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-sm transition-all duration-150 hover:bg-[#1d4ed8] hover:shadow-md active:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[#d4d4d4]">
            AI responses are generated based on your health data and may not be
            medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
