import { inject, Injectable } from '@angular/core';
import { LoginResult } from '../../domain/models/user.model';
import { AuthPort } from '../../domain/ports/auth.port';

@Injectable({ providedIn: 'root' })
export class AuthenticateUserUseCase {
  private authPort = inject(AuthPort);

  execute(userId: string, pin: string): Promise<LoginResult | null> {
    return this.authPort.validatePin(userId, pin);
  }
}
