import { inject, Injectable } from '@angular/core';
import { User, UserRole } from '../../domain/models/user.model';
import { AuthPort } from '../../domain/ports/auth.port';

@Injectable({ providedIn: 'root' })
export class ManageUsersUseCase {
  private port = inject(AuthPort);

  getAll(): Promise<User[]> { return this.port.getUsers(); }
  create(name: string, role: UserRole, pin: string): Promise<User> { return this.port.createUser(name, role, pin); }
  update(id: string, name: string, role: UserRole, pin?: string): Promise<User> { return this.port.updateUser(id, name, role, pin); }
  delete(id: string): Promise<void> { return this.port.deleteUser(id); }
}
