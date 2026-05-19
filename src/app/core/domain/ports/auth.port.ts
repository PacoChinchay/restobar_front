import { User, UserRole } from '../models/user.model';

export abstract class AuthPort {
  abstract getUsers(): Promise<User[]>;
  abstract validatePin(userId: string, pin: string): Promise<User | null>;
  abstract createUser(name: string, role: UserRole, pin: string): Promise<User>;
  abstract updateUser(id: string, name: string, role: UserRole, pin?: string): Promise<User>;
  abstract deleteUser(id: string): Promise<void>;
}
