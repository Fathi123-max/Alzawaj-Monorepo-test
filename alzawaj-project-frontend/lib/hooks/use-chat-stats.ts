import { useEffect, useState } from "react";
import { useChat } from "@/providers/chat-provider";
import { ChatStatsService } from "@/lib/services/chat-stats-service";

/**
 * Custom hook for accessing chat statistics
 * Provides real-time chat statistics based on the chat rooms from the ChatProvider
 * @returns Object containing chat statistics and related information
 */
export const useChatStats = () => {
  const { chatRooms, isConnected } = useChat();
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const [activeChats, setActiveChats] = useState<number>(0);
  const [totalChats, setTotalChats] = useState<number>(0);

  useEffect(() => {
    // Only calculate stats if connected and we have chat rooms
    if (isConnected && chatRooms) {
      const stats = ChatStatsService.getChatStats(chatRooms);
      setTotalUnread(stats.totalUnread);
      setActiveChats(stats.activeChats);
      setTotalChats(stats.totalChats);
    } else {
      // Set defaults when not connected or no chat rooms
      setTotalUnread(0);
      setActiveChats(0);
      setTotalChats(0);
    }
  }, [chatRooms, isConnected]);

  return {
    totalUnread,
    activeChats,
    totalChats,
    isConnected,
    isLoading: isConnected && chatRooms === undefined,
    chatRooms,
  };
};
