import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Tooltip } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { AuthStore } from '../../../core/application/auth.store';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Button, Toast, ConfirmDialog, Tooltip],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnDestroy {
  private authStore = inject(AuthStore);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  readonly currentUser = this.authStore.currentUser;
  readonly currentTime = signal(new Date());

  readonly formattedTime = computed(() =>
    this.currentTime().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
  );

  readonly formattedDate = computed(() =>
    this.currentTime().toLocaleDateString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long',
    }),
  );

  private clockInterval = setInterval(() => this.currentTime.set(new Date()), 60_000);

  ngOnDestroy() {
    clearInterval(this.clockInterval);
  }

  confirmLogout() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres cerrar sesión?',
      header: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Sí, salir',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.authStore.logout();
        this.router.navigate(['/login']);
      },
    });
  }
}
