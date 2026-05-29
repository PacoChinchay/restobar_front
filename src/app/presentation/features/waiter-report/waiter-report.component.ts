import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { WaiterStats, WaiterWeekSummary } from '../../../core/domain/models/waiter-report.model';
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

@Component({
  selector: 'app-waiter-report',
  standalone: true,
  imports: [Button, DecimalPipe, ChartModule],
  templateUrl: './waiter-report.component.html',
  styleUrl: './waiter-report.component.scss',
})
export class WaiterReportComponent implements OnInit {
  private useCase = inject(GetWaiterReportUseCase);

  readonly weekSunday = signal<Date>(getSundayOfWeek(new Date()));
  readonly weekData   = signal<WaiterWeekSummary | null>(null);
  readonly loading    = signal(false);

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
        const [y, m, day] = d.date.split('-').map(Number);
        const date = new Date(y, m - 1, day);
        const weekday = date.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '');
        return [`${weekday}`, `${day}`];
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

  async ngOnInit() {
    await this.loadData(this.weekSunday());
  }

  async loadData(sunday: Date) {
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
    await this.loadData(d);
  }

  async nextWeek() {
    if (this.isCurrentWeek() || this.loading()) return;
    const d = new Date(this.weekSunday());
    d.setDate(d.getDate() + 7);
    this.weekSunday.set(d);
    await this.loadData(d);
  }

  async goToCurrentWeek() {
    const sun = getSundayOfWeek(new Date());
    this.weekSunday.set(sun);
    await this.loadData(sun);
  }

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
