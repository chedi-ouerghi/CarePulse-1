import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import type { ChatMessage, DisplayMessage, Conversation } from "@/lib/types";

export function usePatientChat(patientId: string | undefined) {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // 1. Fetch conversations
  const conversationsQuery = useQuery({
    queryKey: ["conversations", patientId],
    queryFn: () => queries.chat.getConversations(patientId!),
    enabled: !!patientId,
  });

  // 2. Fetch messages for active conversation with 5s polling
  const messagesQuery = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: () => queries.chat.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
    refetchInterval: 5000,
  });

  // 3. Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: () => queries.chat.createConversation(patientId!),
    onSuccess: (newConv) => {
      setActiveConversationId(newConv.id);
      queryClient.invalidateQueries({ queryKey: ["conversations", patientId] });
    },
  });

  // 4. Send message mutation (handles auto-creation of conversation if needed)
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      let targetConvId = activeConversationId;
      if (!targetConvId) {
        const newConv = await queries.chat.createConversation(patientId!);
        targetConvId = newConv.id;
        setActiveConversationId(targetConvId);
        queryClient.invalidateQueries({ queryKey: ["conversations", patientId] });
      }
      return queries.chat.send(targetConvId, content);
    },
    onSuccess: (_, content) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", activeConversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations", patientId],
      });
    },
  });

  // 5. Transform raw ChatMessage backend items to normalized DisplayMessage
  const displayMessages: DisplayMessage[] = useMemo(() => {
    if (!messagesQuery.data) return [];
    return messagesQuery.data.map((msg: ChatMessage) => ({
      id: msg.id,
      role: msg.sender === "PATIENT" ? "user" : "assistant",
      content: msg.contentText || (msg.transcript ? `[Voice]: ${msg.transcript}` : ""),
      createdAt: msg.createdAt,
      status: msg.status === "FAILED" ? "failed" : "sent",
    }));
  }, [messagesQuery.data]);

  const handleSelectConversation = useCallback((id: string | null) => {
    setActiveConversationId(id);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  return {
    conversations: (conversationsQuery.data as Conversation[]) || [],
    isLoadingConversations: conversationsQuery.isLoading,
    activeConversationId,
    selectConversation: handleSelectConversation,
    startNewChat: handleNewChat,
    messages: displayMessages,
    isLoadingMessages: messagesQuery.isLoading,
    isMessagesError: messagesQuery.isError,
    messagesError: messagesQuery.error,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    sendError: sendMutation.error,
  };
}
