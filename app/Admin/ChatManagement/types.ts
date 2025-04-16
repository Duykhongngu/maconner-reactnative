export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  userName: string;
  isAdmin: boolean;
  isRead?: boolean;
}

export interface UserData {
  displayName: string;
  profileImage: string;
  email: string;
}

export interface User {
  id: string;
  name: string;
  profileImage?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
} 