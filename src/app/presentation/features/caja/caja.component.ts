import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { CashMovement, CashSession } from '../../../core/domain/models/cash-session.model';
import { GetCashSessionUseCase } from '../../../core/application/use-cases/get-cash-session.use-case';
import { OpenCashSessionUseCase } from '../../../core/application/use-cases/open-cash-session.use-case';
import { AddCashMovementUseCase } from '../../../core/application/use-cases/add-cash-movement.use-case';
import { AuthStore } from '../../../core/application/auth.store';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss',
})
export class CajaComponent implements OnInit {
  private authStore    = inject(AuthStore);
  private getCashSession   = inject(GetCashSessionUseCase);
  private openCashSession  = inject(OpenCashSessionUseCase);
  private addCashMovement  = inject(AddCashMovementUseCase);
  private messageService   = inject(MessageService);

  readonly currentUser = this.authStore.currentUser;
  readonly loading     = signal(true);
  readonly session     = signal<CashSession | null>(null);
  readonly opening     = signal(false);
  readonly submitting  = signal(false);
  readonly showForm    = signal(false);

  // Open-session form
  readonly openAmount = signal('');

  // Movement form
  readonly formType        = signal<'ingreso' | 'egreso'>('ingreso');
  readonly formAmount      = signal('');
  readonly formDescription = signal('');

  readonly balance = computed(() => this.session()?.balance ?? 0);

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    this.loading.set(true);
    try {
      this.session.set(await this.getCashSession.execute());
    } finally {
      this.loading.set(false);
    }
  }

  async openSession() {
    const amount = parseFloat(this.openAmount());
    if (!amount || amount <= 0) return;
    this.opening.set(true);
    try {
      const s = await this.openCashSession.execute(amount, this.currentUser()?.name ?? '');
      this.session.set(s);
      this.openAmount.set('');
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir la caja' });
    } finally {
      this.opening.set(false);
    }
  }

  toggleForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) this.resetForm();
  }

  async submitMovement() {
    const amount = parseFloat(this.formAmount());
    const desc   = this.formDescription().trim();
    if (!amount || amount <= 0 || !desc) return;

    this.submitting.set(true);
    try {
      const mv = await this.addCashMovement.execute(
        this.session()!.id,
        this.formType(),
        amount,
        desc,
        this.currentUser()?.name ?? '',
      );
      this.session.update(s => {
        if (!s) return s;
        const sign = mv.movementType === 'ingreso' ? 1 : -1;
        return {
          ...s,
          movements: [...s.movements, mv],
          balance: s.balance + sign * mv.amount,
        };
      });
      this.showForm.set(false);
      this.resetForm();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el movimiento' });
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm() {
    this.formType.set('ingreso');
    this.formAmount.set('');
    this.formDescription.set('');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }

  formatTime(isoStr: string): string {
    return new Date(isoStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  trackById(_: number, m: CashMovement) { return m.id; }
}
