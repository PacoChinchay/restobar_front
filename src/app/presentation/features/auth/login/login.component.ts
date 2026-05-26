import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../../core/domain/models/user.model';
import { AuthPort } from '../../../../core/domain/ports/auth.port';
import { AuthenticateUserUseCase } from '../../../../core/application/use-cases/authenticate-user.use-case';
import { AuthStore } from '../../../../core/application/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private authPort = inject(AuthPort);
  private authenticateUser = inject(AuthenticateUserUseCase);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  readonly users = signal<User[]>([]);
  readonly selectedUser = signal<User | null>(null);
  readonly step = signal<1 | 2>(1);
  readonly pin = signal('');
  readonly error = signal('');
  readonly checking = signal(false);

  readonly keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'];
  readonly numKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  async ngOnInit() {
    this.users.set(await this.authPort.getUsers());
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
  }

  goToPin() {
    this.step.set(2);
    this.pin.set('');
    this.error.set('');
  }

  backToUsers() {
    this.step.set(1);
    this.pin.set('');
    this.error.set('');
  }

  async keyPress(key: string) {
    if (this.checking()) return;
    if (key === '←') {
      this.pin.update(p => p.slice(0, -1));
      this.error.set('');
      return;
    }
    if (key === '' || this.pin().length >= 4) return;

    const newPin = this.pin() + key;
    this.pin.set(newPin);

    if (newPin.length === 4) {
      await this.validatePin(newPin);
    }
  }

  private async validatePin(pin: string) {
    this.checking.set(true);
    try {
      const user = await this.authenticateUser.execute(this.selectedUser()!.id, pin);
      if (user) {
        this.authStore.login(user);
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set('PIN incorrecto. Intenta nuevamente.');
        this.pin.set('');
      }
    } finally {
      this.checking.set(false);
    }
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = { administrador: 'Administrador', cajero: 'Cajero', camarero: 'Camarero', cocinero: 'Cocinero' };
    return labels[role] ?? role;
  }
}
