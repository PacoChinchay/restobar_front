export type UserRole = 'administrador' | 'cajero' | 'camarero' | 'cocinero';

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  cajero: 'Cajero',
  camarero: 'Camarero',
  cocinero: 'Cocinero',
};

export const ALL_ROLES: UserRole[] = ['administrador', 'cajero', 'camarero', 'cocinero'];

export interface User {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
}

export interface AuthSession {
  user: User;
  loginAt: Date;
}
