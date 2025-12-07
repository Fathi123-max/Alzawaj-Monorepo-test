export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  read: boolean;
  type: "text" | "image" | "file";
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocketEvent {
  event: string;
  data: any;
}

export interface ChatContextType {
  socket: any | null; // Using 'any' since Socket type will be defined in the implementation
  isConnected: boolean;
  isAuthenticating: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  sendMessage: (roomId: string, content: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  getMessages: (roomId: string) => Promise<Message[]>;
  createRoom: (participantIds: string[]) => Promise<ChatRoom>;
  currentRoomId: string | null;
  setCurrentRoomId: (roomId: string | null) => void;
}
