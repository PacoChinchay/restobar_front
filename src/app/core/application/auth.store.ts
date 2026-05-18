import { computed, Injectable, signal } from '@angular/core';
import { AuthSession, User } from '../domain/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly session = signal<AuthSession | null>(null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly currentUser = computed(() => this.session()?.user ?? null);

  login(user: User): void {
    this.session.set({ user, loginAt: new Date() });
  }

  logout(): void {
    this.session.set(null);
  }
}
