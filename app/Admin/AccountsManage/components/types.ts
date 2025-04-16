export interface Account {
  id: string;
  displayName: string;
  email: string;
  role: number;
  profileImage?: string;
  phone_number?: string;
  address?: string;
}

export interface NewAccount {
  displayName: string;
  email: string;
  password: string;
  role: number;
  profileImage: string;
  phone_number: string;
  address: string;
} 