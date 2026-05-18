export type UserRole = 'admin' | 'cajero';

export interface User {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  pin: string;
}

export interface AuthSession {
  user: User;
  loginAt: Date;
}
