export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  userName: string;
  isAdmin: boolean;
  isRead: boolean;
}

export interface UserData {
  displayName: string;
  profileImage?: string;
}

export interface User {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  profileImage?: string;
}

export interface ChatHeaderProps {
  showUserList: boolean;
  selectedUser: string | null;
  totalUnreadCount: number;
  userName?: string;
  onBackPress: () => void;
}

export interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSend: () => void;
  isLoading: boolean;
}

export interface MessageItemProps {
  message: Message;
  formatTime: (date: Date) => string;
}

export interface UserListItemProps {
  user: User;
  onSelect: (userId: string) => void;
  formatTime: (date: Date) => string;
} 