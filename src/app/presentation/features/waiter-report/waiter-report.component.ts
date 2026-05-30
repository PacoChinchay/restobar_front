import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { WaiterDaySummary, WaiterStats, WaiterWeekSummary } from '../../../core/domain/models/waiter-report.model';
import { GetWaiterReportUseCase } from '../../../core/application/use-cases/get-waiter-report.use-case';

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSundayOfWeek(date: Date): Date {
  const mon = getMondayOfWeek(date);
  const d = new Date(mon);
  d.setDate(d.getDate() + 6);
  return d;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Component({
  selector: 'app-waiter-report',
  standalone: true,
  imports: [Button, DecimalPipe, ChartModule],
  templateUrl: './waiter-report.component.html',
  styleUrl: './waiter-report.component.scss',
})
export class WaiterReportComponent implements OnInit {
  private useCase = inject(GetWaiterReportUseCase);

  // ── mode ────────────────────────────────────────────────────────────────────
  readonly viewMode = signal<'week' | 'day'>('week');

  // ── week state ───────────────────────────────────────────────────────────────
  readonly weekSunday = signal<Date>(getSundayOfWeek(new Date()));
  readonly weekData   = signal<WaiterWeekSummary | null>(null);

  readonly isCurrentWeek = computed(() => {
    const todaySun = getSundayOfWeek(new Date());
    return toDateParam(todaySun) === toDateParam(this.weekSunday());
  });

  readonly weekLabel = computed(() => {
    const sun = this.weekSunday();
    const mon = new Date(sun);
    mon.setDate(mon.getDate() - 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '');
    return `${fmt(mon)} – ${fmt(sun)}`;
  });

  readonly waiters = computed(() => this.weekData()?.waiters ?? []);

  readonly totalOrdersWeek = computed(() =>
    this.waiters().reduce((s, w) => s + w.totalOrders, 0),
  );

  readonly chartData = computed(() => {
    const data = this.weekData()?.dailyTotals ?? [];
    return {
      labels: data.map(d => {
        const [y, mo, dy] = d.date.split('-').map(Number);
        const date = new Date(y, mo - 1, dy);
        const weekday = date.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '');
        return [`${weekday}`, `${dy}`];
      }),
      datasets: [{
        data: data.map(d => d.orderCount),
        backgroundColor: '#FFD480',
        hoverBackgroundColor: '#FFC043',
        borderRadius: 6,
        borderSkipped: false,
      }],
    };
  });

  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => ` ${ctx.raw as number} comanda${(ctx.raw as number) !== 1 ? 's' : ''}`,
          title: () => '',
        },
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { size: 11 }, color: '#6b7280' },
      },
      y: {
        grid: { color: '#f3f4f6' },
        border: { display: false },
        ticks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (v: any) => (v > 0 && Number.isInteger(v)) ? v : '',
          font: { size: 11 },
          color: '#9ca3af',
          stepSize: 1,
        },
      },
    },
  };

  // ── day state ────────────────────────────────────────────────────────────────
  readonly viewDate = signal<Date>(today());
  readonly dayData  = signal<WaiterDaySummary | null>(null);

  readonly isToday = computed(() =>
    toDateParam(this.viewDate()) === toDateParam(today()),
  );

  readonly dayLabel = computed(() => {
    const d = this.viewDate();
    return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  });

  readonly dayWaiters = computed(() => this.dayData()?.waiters ?? []);

  readonly totalOrdersDay = computed(() =>
    this.dayWaiters().reduce((s, w) => s + w.totalOrders, 0),
  );

  // ── shared ───────────────────────────────────────────────────────────────────
  readonly loading = signal(false);

  async ngOnInit() {
    await this.loadWeek(this.weekSunday());
  }

  async switchMode(mode: 'week' | 'day') {
    if (this.viewMode() === mode || this.loading()) return;
    this.viewMode.set(mode);
    if (mode === 'day') {
      await this.loadDay(this.viewDate());
    } else {
      await this.loadWeek(this.weekSunday());
    }
  }

  // ── week navigation ───────────────────────────────────────────────────────────
  async loadWeek(sunday: Date) {
    this.loading.set(true);
    try {
      this.weekData.set(await this.useCase.getWeeklyStats(sunday));
    } finally {
      this.loading.set(false);
    }
  }

  async prevWeek() {
    if (this.loading()) return;
    const d = new Date(this.weekSunday());
    d.setDate(d.getDate() - 7);
    this.weekSunday.set(d);
    await this.loadWeek(d);
  }

  async nextWeek() {
    if (this.isCurrentWeek() || this.loading()) return;
    const d = new Date(this.weekSunday());
    d.setDate(d.getDate() + 7);
    this.weekSunday.set(d);
    await this.loadWeek(d);
  }

  async goToCurrentWeek() {
    const sun = getSundayOfWeek(new Date());
    this.weekSunday.set(sun);
    await this.loadWeek(sun);
  }

  // ── day navigation ────────────────────────────────────────────────────────────
  async loadDay(date: Date) {
    this.loading.set(true);
    try {
      this.dayData.set(await this.useCase.getDailyStats(date));
    } finally {
      this.loading.set(false);
    }
  }

  async prevDay() {
    if (this.loading()) return;
    const d = new Date(this.viewDate());
    d.setDate(d.getDate() - 1);
    this.viewDate.set(d);
    await this.loadDay(d);
  }

  async nextDay() {
    if (this.isToday() || this.loading()) return;
    const d = new Date(this.viewDate());
    d.setDate(d.getDate() + 1);
    this.viewDate.set(d);
    await this.loadDay(d);
  }

  async goToToday() {
    const t = today();
    this.viewDate.set(t);
    await this.loadDay(t);
  }

  // ── helpers ───────────────────────────────────────────────────────────────────
  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  rankLabel(index: number): string {
    return index === 0 ? '1°' : index === 1 ? '2°' : index === 2 ? '3°' : `${index + 1}°`;
  }

  rankClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return '';
  }

  trackByName(_: number, w: WaiterStats) { return w.name; }
}
