import { ChatRoom } from "@/lib/types";

/**
 * Chat Statistics Service
 * Provides utilities for calculating chat-related statistics
 */
export class ChatStatsService {
  /**
   * Calculate the total number of unread messages across all chat rooms
   * @param chatRooms - Array of chat rooms
   * @returns Total count of unread messages
   */
  static getTotalUnreadCount(chatRooms: ChatRoom[] = []): number {
    if (!Array.isArray(chatRooms) || chatRooms.length === 0) {
      return 0;
    }

    return chatRooms.reduce((total, room) => {
      // Ensure unreadCount is a valid number before adding
      const unreadCount =
        typeof (room as any).unreadCount === "number"
          ? (room as any).unreadCount
          : 0;
      return total + Math.max(0, unreadCount);
    }, 0);
  }

  /**
   * Get the count of active chat rooms (rooms with unread messages or recent activity)
   * @param chatRooms - Array of chat rooms
   * @returns Count of active chat rooms
   */
  static getActiveChatRoomsCount(chatRooms: ChatRoom[] = []): number {
    if (!Array.isArray(chatRooms) || chatRooms.length === 0) {
      return 0;
    }

    return chatRooms.filter((room) => {
      const unreadCount =
        typeof (room as any).unreadCount === "number"
          ? (room as any).unreadCount
          : 0;
      return unreadCount > 0;
    }).length;
  }

  /**
   * Get chat statistics object
   * @param chatRooms - Array of chat rooms
   * @returns Object containing various chat statistics
   */
  static getChatStats(chatRooms: ChatRoom[] = []) {
    return {
      totalUnread: this.getTotalUnreadCount(chatRooms),
      activeChats: this.getActiveChatRoomsCount(chatRooms),
      totalChats: Array.isArray(chatRooms) ? chatRooms.length : 0,
    };
  }
}

/**
 * Cache for chat statistics to prevent unnecessary recalculations
 */
export class ChatStatsCache {
  private static cache: Map<string, { value: number; timestamp: number }> =
    new Map();
  private static TTL = 30000; // 30 seconds

  /**
   * Get cached unread count if available and not expired
   * @param userId - User ID to identify the cache entry
   * @returns Cached value or null if expired/doesn't exist
   */
  static getUnreadCount(userId: string): number | null {
    const key = `unreadCount_${userId}`;
    const cached = this.cache.get(key);

    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < this.TTL) {
        return cached.value;
      } else {
        // Remove expired cache
        this.cache.delete(key);
      }
    }

    return null;
  }

  /**
   * Set cached unread count
   * @param userId - User ID to identify the cache entry
   * @param value - Value to cache
   */
  static setUnreadCount(userId: string, value: number): void {
    const key = `unreadCount_${userId}`;
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Clear cached value for a user
   * @param userId - User ID whose cache to clear
   */
  static clearUnreadCount(userId: string): void {
    const key = `unreadCount_${userId}`;
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  static clearAll(): void {
    this.cache.clear();
  }
}
