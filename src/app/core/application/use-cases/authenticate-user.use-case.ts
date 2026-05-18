import { inject, Injectable } from '@angular/core';
import { User } from '../../domain/models/user.model';
import { AuthPort } from '../../domain/ports/auth.port';

@Injectable({ providedIn: 'root' })
export class AuthenticateUserUseCase {
  private authPort = inject(AuthPort);

  execute(userId: string, pin: string): Promise<User | null> {
    return this.authPort.validatePin(userId, pin);
  }
}
