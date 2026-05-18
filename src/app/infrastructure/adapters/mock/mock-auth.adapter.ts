import { Injectable } from '@angular/core';
import { User } from '../../../core/domain/models/user.model';
import { AuthPort } from '../../../core/domain/ports/auth.port';

const MOCK_USERS: User[] = [
  { id: 'admin',  name: 'Administrador', initials: 'AD', role: 'admin',  pin: '1234' },
  { id: 'cajero', name: 'Cajero',        initials: 'CA', role: 'cajero', pin: '5678' },
];

@Injectable()
export class MockAuthAdapter extends AuthPort {
  async getUsers(): Promise<User[]> {
    return [...MOCK_USERS];
  }

  async validatePin(userId: string, pin: string): Promise<User | null> {
    return MOCK_USERS.find(u => u.id === userId && u.pin === pin) ?? null;
  }
}
