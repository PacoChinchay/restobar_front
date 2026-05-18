import { User } from '../models/user.model';

export abstract class AuthPort {
  abstract getUsers(): Promise<User[]>;
  abstract validatePin(userId: string, pin: string): Promise<User | null>;
}
