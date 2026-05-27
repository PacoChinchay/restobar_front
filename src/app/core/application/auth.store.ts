import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthSession, User } from '../domain/models/user.model';
import { StockHubService } from '../../infrastructure/realtime/stock-hub.service';

const SESSION_KEY = 'restobar_session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly stockHub = inject(StockHubService);

  readonly session = signal<AuthSession | null>(this._loadFromStorage());
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly currentUser = computed(() => this.session()?.user ?? null);

  constructor() {
    const existing = this.session();
    if (existing) void this.stockHub.connect(existing.token);
  }

  login(user: User, token: string): void {
    const session: AuthSession = { user, token, loginAt: new Date() };
    this.session.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    void this.stockHub.connect(token);
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(SESSION_KEY);
    void this.stockHub.disconnect();
  }

  private _loadFromStorage(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return { ...parsed, loginAt: new Date(parsed.loginAt) };
    } catch {
      return null;
    }
  }
}
