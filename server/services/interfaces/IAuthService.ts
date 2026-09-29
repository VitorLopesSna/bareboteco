import type { User, UserRole } from '../../../src/types.ts';

export interface LoginResult {
  token?: string;
  user?: User;
  error?: string;
  isLocked?: boolean;
  remainingSeconds?: number;
  remainingAttempts?: number;
}

export interface IAuthService {
  login(username: string, passwordPlain: string, clientIp?: string): LoginResult;
  register(data: {
    username: string;
    name: string;
    passwordPlain: string;
    role?: UserRole;
  }): { token?: string; user?: User; error?: string };
  validateSession(token: string): User | null;
  logout(token: string): boolean;
  getAllUsers(): User[];
}
