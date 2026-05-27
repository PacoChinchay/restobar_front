import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { DailySummary, DailyTotal, Sale } from '../../../core/domain/models/sale.model';
import { GetDailySummaryUseCase } from '../../../core/application/use-cases/get-daily-summary.use-case';
import { SaleRepositoryPort } from '../../../core/domain/ports/sale.repository.port';

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
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
  selector: 'app-cash-report',
  standalone: true,
  imports: [Button, TableModule, Tooltip, DecimalPipe, ChartModule],
  templateUrl: './cash-report.component.html',
  styleUrl: './cash-report.component.scss',
})
export class CashReportComponent implements OnInit {
  private getDailySummaryUseCase = inject(GetDailySummaryUseCase);
  private saleRepo = inject(SaleRepositoryPort);

  // ── Week state (controls the chart) ──────────────────────────────────────
  readonly weekSunday = signal<Date>(getSundayOfWeek(new Date()));
  readonly weeklyData = signal<DailyTotal[]>([]);
  readonly loadingChart = signal(false);

  // ── Day state (controls the details) ─────────────────────────────────────
  readonly selectedDate = signal<Date>(new Date());
  readonly summary = signal<DailySummary | null>(null);
  readonly allSales = signal<Sale[]>([]);
  readonly loadingDetails = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
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

  readonly formattedDate = computed(() =>
    this.selectedDate().toLocaleDateString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long',
    }),
  );

  readonly digital = computed(
    () => (this.summary()?.byPaymentMethod.yape ?? 0) + (this.summary()?.byPaymentMethod.plin ?? 0),
  );

  readonly weeklyAvg = computed(() => {
    const data = this.weeklyData();
    if (!data.length) return 0;
    return data.reduce((s, d) => s + d.total, 0) / 7;
  });

  readonly comparison = computed((): { delta: number; pct: number | null } | null => {
    const avg = this.weeklyAvg();
    const dayTotal = this.summary()?.totalAmount ?? 0;
    if (avg === 0 && dayTotal === 0) return null;
    const delta = dayTotal - avg;
    const pct = avg > 0 ? (delta / avg) * 100 : null;
    return { delta, pct };
  });

  readonly chartData = computed(() => {
    const data = this.weeklyData();
    const selected = toDateParam(this.selectedDate());
    return {
      labels: data.map(d => {
        const [y, m, day] = d.date.split('-').map(Number);
        const date = new Date(y, m - 1, day);
        const weekday = date.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '');
        return [`${weekday}`, `${day}`];
      }),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: data.map(d =>
          d.date === selected ? '#E88C00' : '#FFD480',
        ),
        hoverBackgroundColor: data.map(d =>
          d.date === selected ? '#CF7B00' : '#FFC043',
        ),
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
          label: (ctx: any) => ` S/ ${(ctx.raw as number).toFixed(2)}`,
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
          callback: (v: any) => v > 0 ? `S/${v}` : '',
          font: { size: 11 },
          color: '#9ca3af',
        },
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick: (_event: unknown, elements: any[]) => {
      if (elements.length > 0) {
        const day = this.weeklyData()[elements[0].index];
        if (day) void this.selectDay(day.date);
      }
    },
  };

  async ngOnInit() {
    const today = new Date();
    await Promise.all([
      this.loadWeekChart(getSundayOfWeek(today)),
      this.loadDayDetails(today),
    ]);
  }

  async loadWeekChart(sunday: Date) {
    this.loadingChart.set(true);
    try {
      this.weeklyData.set(await this.getDailySummaryUseCase.getWeeklyTotals(sunday));
    } finally {
      this.loadingChart.set(false);
    }
  }

  async loadDayDetails(date: Date) {
    this.loadingDetails.set(true);
    try {
      const [summary, sales] = await Promise.all([
        this.getDailySummaryUseCase.execute(date),
        this.saleRepo.getByDate(date),
      ]);
      this.summary.set(summary);
      this.allSales.set(sales);
    } finally {
      this.loadingDetails.set(false);
    }
  }

  async prevWeek() {
    if (this.loadingChart()) return;
    const d = new Date(this.weekSunday());
    d.setDate(d.getDate() - 7);
    this.weekSunday.set(d);
    const mon = new Date(d);
    mon.setDate(mon.getDate() - 6);
    this.selectedDate.set(mon);
    await Promise.all([this.loadWeekChart(d), this.loadDayDetails(mon)]);
  }

  async nextWeek() {
    if (this.isCurrentWeek() || this.loadingChart()) return;
    const d = new Date(this.weekSunday());
    d.setDate(d.getDate() + 7);
    this.weekSunday.set(d);
    const mon = new Date(d);
    mon.setDate(mon.getDate() - 6);
    this.selectedDate.set(mon);
    await Promise.all([this.loadWeekChart(d), this.loadDayDetails(mon)]);
  }

  async goToCurrentWeek() {
    const today = new Date();
    const sun = getSundayOfWeek(today);
    this.weekSunday.set(sun);
    this.selectedDate.set(today);
    await Promise.all([this.loadWeekChart(sun), this.loadDayDetails(today)]);
  }

  async selectDay(dateStr: string) {
    if (this.loadingDetails()) return;
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    this.selectedDate.set(date);
    await this.loadDayDetails(date);
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  paymentLabel(method: string): string {
    const labels: Record<string, string> = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin' };
    return labels[method] ?? method;
  }
}
