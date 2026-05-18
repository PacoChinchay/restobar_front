import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';
import { User, UserRole } from '../../../core/domain/models/user.model';
import { AuthPort } from '../../../core/domain/ports/auth.port';
import { API_BASE } from './api.base';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(dto: any): User {
  return {
    ...dto,
    pin: '',
    // Normaliza a minúsculas por si el backend serializa "Admin" en vez de "admin"
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

  async validatePin(userId: string, pin: string): Promise<User | null> {
    const dto = await firstValueFrom(
      this.http.post<any>(`${API_BASE}/api/Auth/validate-pin`, { userId, pin }).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) return of(null);
          throw err;
        }),
      ),
    );
    return dto ? mapUser(dto) : null;
  }
}
