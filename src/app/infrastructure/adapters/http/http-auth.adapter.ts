import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';
import { LoginResult, User, UserRole } from '../../../core/domain/models/user.model';
import { AuthPort } from '../../../core/domain/ports/auth.port';
import { API_BASE } from './api.base';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(dto: any): User {
  return {
    id: dto.id,
    name: dto.name,
    initials: dto.initials,
    role: (dto.role as string).toLowerCase() as UserRole,
  };
}

@Injectable()
export class HttpAuthAdapter extends AuthPort {
  private readonly http = inject(HttpClient);

  async getUsers(): Promise<User[]> {
    const dtos = await firstValueFrom(this.http.get<any[]>(`${API_BASE}/api/Auth/users`));
    return dtos.map(mapUser);
  }

  async validatePin(userId: string, pin: string): Promise<LoginResult | null> {
    const dto = await firstValueFrom(
      this.http.post<any>(`${API_BASE}/api/Auth/validate-pin`, { userId, pin }).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) return of(null);
          throw err;
        }),
      ),
    );
    if (!dto) return null;
    return { user: mapUser(dto.user), token: dto.token as string };
  }

  async createUser(name: string, role: UserRole, pin: string): Promise<User> {
    const dto = await firstValueFrom(
      this.http.post<any>(`${API_BASE}/api/Users`, { name, role, pin }),
    );
    return mapUser(dto);
  }

  async updateUser(id: string, name: string, role: UserRole, pin?: string): Promise<User> {
    const dto = await firstValueFrom(
      this.http.put<any>(`${API_BASE}/api/Users/${id}`, { name, role, pin: pin || null }),
    );
    return mapUser(dto);
  }

  async deleteUser(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE}/api/Users/${id}`));
  }
}
