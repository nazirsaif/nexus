export type UserRole = 'entrepreneur' | 'investor' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  isOnline?: boolean;
  createdAt: string;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
  website?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
  location?: string;
  website?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  organizerId: string;
  participants: { userId: string; status: 'pending' | 'accepted' | 'rejected' | 'cancelled' }[];
  status?: 'scheduled' | 'cancelled' | 'completed';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forceLogout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>, extendedProfileData?: any) => Promise<void>;
  getExtendedProfile?: () => Promise<any>;
  updateExtendedProfile?: (profileData: any) => Promise<any>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}