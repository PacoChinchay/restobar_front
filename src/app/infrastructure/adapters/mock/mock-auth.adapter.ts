import { Injectable } from '@angular/core';
import { User, UserRole } from '../../../core/domain/models/user.model';
import { AuthPort } from '../../../core/domain/ports/auth.port';

const MOCK_PINS: Record<string, string> = { admin: '1234', cajero: '5678' };

const MOCK_USERS: User[] = [
  { id: 'admin',  name: 'Administrador', initials: 'AD', role: 'administrador' },
  { id: 'cajero', name: 'Cajero',        initials: 'CA', role: 'cajero' },
];

@Injectable()
export class MockAuthAdapter extends AuthPort {
  async getUsers(): Promise<User[]> { return [...MOCK_USERS]; }

  async validatePin(userId: string, pin: string): Promise<User | null> {
    const user = MOCK_USERS.find(u => u.id === userId);
    return user && MOCK_PINS[userId] === pin ? user : null;
  }

  async createUser(name: string, role: UserRole, _pin: string): Promise<User> {
    const user: User = { id: Date.now().toString(), name, initials: name.slice(0, 2).toUpperCase(), role };
    MOCK_USERS.push(user);
    return user;
  }

  async updateUser(id: string, name: string, role: UserRole): Promise<User> {
    const user = MOCK_USERS.find(u => u.id === id)!;
    user.name = name; user.role = role;
    user.initials = name.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const i = MOCK_USERS.findIndex(u => u.id === id);
    if (i >= 0) MOCK_USERS.splice(i, 1);
  }
}
