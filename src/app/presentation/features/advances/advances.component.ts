import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { EmployeeAdvanceSummary, SalaryAdvance } from '../../../core/domain/models/salary-advance.model';
import { GetAdvanceSummariesUseCase } from '../../../core/application/use-cases/get-advance-summaries.use-case';
import { CreateAdvanceUseCase } from '../../../core/application/use-cases/create-advance.use-case';
import { AuthStore } from '../../../core/application/auth.store';

function mondayOf(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = (day + 6) % 7;
  r.setDate(r.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

@Component({
  selector: 'app-advances',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './advances.component.html',
  styleUrl: './advances.component.scss',
})
export class AdvancesComponent implements OnInit {
  private getSummaries  = inject(GetAdvanceSummariesUseCase);
  private createAdvance = inject(CreateAdvanceUseCase);
  private messageService = inject(MessageService);
  private authStore = inject(AuthStore);

  readonly currentUser = this.authStore.currentUser;
  readonly loading     = signal(true);
  readonly summaries   = signal<EmployeeAdvanceSummary[]>([]);
  readonly weekMonday  = signal(mondayOf(new Date()));

  readonly expandedId  = signal<string | null>(null);
  readonly advAmount   = signal('');
  readonly advNotes    = signal('');
  readonly submitting  = signal(false);

  readonly weekLabel = computed(() => {
    const mon = this.weekMonday();
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
    return `${fmt(mon)} – ${fmt(sun)}`;
  });

  readonly isCurrentWeek = computed(() => {
    const now = mondayOf(new Date());
    return this.weekMonday().getTime() === now.getTime();
  });

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading.set(true);
    try { this.summaries.set(await this.getSummaries.execute(this.weekMonday())); }
    finally { this.loading.set(false); }
  }

  async prevWeek() {
    const d = new Date(this.weekMonday()); d.setDate(d.getDate() - 7);
    this.weekMonday.set(d); await this.load();
  }

  async nextWeek() {
    if (this.isCurrentWeek()) return;
    const d = new Date(this.weekMonday()); d.setDate(d.getDate() + 7);
    this.weekMonday.set(d); await this.load();
  }

  async goToCurrentWeek() {
    this.weekMonday.set(mondayOf(new Date())); await this.load();
  }

  toggleForm(userId: string) {
    if (this.expandedId() === userId) {
      this.expandedId.set(null);
      this.resetForm();
    } else {
      this.expandedId.set(userId);
      this.resetForm();
    }
  }

  async submitAdvance(emp: EmployeeAdvanceSummary) {
    const amount = parseFloat(this.advAmount());
    if (!amount || amount <= 0) return;
    this.submitting.set(true);
    try {
      const adv = await this.createAdvance.execute(
        emp.userId, emp.name, amount,
        this.advNotes().trim() || null,
        this.currentUser()?.name ?? '',
      );
      this.summaries.update(list =>
        list.map(e => e.userId !== emp.userId ? e : {
          ...e,
          advancedThisWeek: e.advancedThisWeek + adv.amount,
          remaining: e.remaining - adv.amount,
          weekAdvances: [...e.weekAdvances, adv],
        }),
      );
      this.expandedId.set(null);
      this.resetForm();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el adelanto' });
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm() { this.advAmount.set(''); this.advNotes.set(''); }

  pct(emp: EmployeeAdvanceSummary): number {
    if (!emp.weeklySalary) return 0;
    return Math.min(100, (emp.advancedThisWeek / emp.weeklySalary) * 100);
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  trackById(_: number, e: EmployeeAdvanceSummary) { return e.userId; }
  trackByAdv(_: number, a: SalaryAdvance) { return a.id; }
}
