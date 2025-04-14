
import { User, Session } from '@supabase/supabase-js';
import { User as AppUser } from "@/types";

export interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, avatarUrl?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateProfile: (updateData: Record<string, unknown>) => Promise<{ success: boolean }>;
}
