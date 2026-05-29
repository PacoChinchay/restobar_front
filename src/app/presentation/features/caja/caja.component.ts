import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CashMovement, CashSession } from '../../../core/domain/models/cash-session.model';
import { GetCashSessionUseCase } from '../../../core/application/use-cases/get-cash-session.use-case';
import { OpenCashSessionUseCase } from '../../../core/application/use-cases/open-cash-session.use-case';
import { AddCashMovementUseCase } from '../../../core/application/use-cases/add-cash-movement.use-case';
import { CashSessionPort } from '../../../core/domain/ports/cash-session.port';
import { AuthStore } from '../../../core/application/auth.store';

function today(): Date {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss',
})
export class CajaComponent implements OnInit {
  private authStore        = inject(AuthStore);
  private getCashSession   = inject(GetCashSessionUseCase);
  private openCashSession  = inject(OpenCashSessionUseCase);
  private addCashMovement  = inject(AddCashMovementUseCase);
  private cashPort         = inject(CashSessionPort);
  private messageService   = inject(MessageService);

  readonly currentUser = this.authStore.currentUser;
  readonly loading     = signal(true);
  readonly session     = signal<CashSession | null>(null);
  readonly viewDate    = signal(today());
  readonly opening     = signal(false);
  readonly submitting  = signal(false);
  readonly showForm    = signal(false);

  readonly openAmount      = signal('');
  readonly formType        = signal<'ingreso' | 'egreso'>('ingreso');
  readonly formAmount      = signal('');
  readonly formDescription = signal('');

  readonly balance  = computed(() => this.session()?.balance ?? 0);
  readonly isToday  = computed(() => this.viewDate().getTime() === today().getTime());

  readonly dateLabel = computed(() =>
    this.viewDate().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }),
  );

  async ngOnInit() { await this.load(); }

  private async load() {
    this.loading.set(true);
    this.showForm.set(false);
    try {
      const s = this.isToday()
        ? await this.getCashSession.execute()
        : await this.cashPort.getByDate(this.viewDate());
      this.session.set(s);
    } finally {
      this.loading.set(false);
    }
  }

  async prevDay() {
    const d = new Date(this.viewDate()); d.setDate(d.getDate() - 1);
    this.viewDate.set(d); await this.load();
  }

  async nextDay() {
    if (this.isToday()) return;
    const d = new Date(this.viewDate()); d.setDate(d.getDate() + 1);
    this.viewDate.set(d); await this.load();
  }

  async goToToday() { this.viewDate.set(today()); await this.load(); }

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
        this.session()!.id, this.formType(), amount, desc, this.currentUser()?.name ?? '',
      );
      this.session.update(s => {
        if (!s) return s;
        const sign = mv.movementType === 'ingreso' ? 1 : -1;
        return { ...s, movements: [...s.movements, mv], balance: s.balance + sign * mv.amount };
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
    this.formType.set('ingreso'); this.formAmount.set(''); this.formDescription.set('');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  formatTime(isoStr: string): string {
    return new Date(isoStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  trackById(_: number, m: CashMovement) { return m.id; }
}
