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

  readonly selectedDate = signal<Date>(new Date());
  readonly summary = signal<DailySummary | null>(null);
  readonly allSales = signal<Sale[]>([]);
  readonly weeklyData = signal<DailyTotal[]>([]);
  readonly loading = signal(false);

  readonly digital = computed(
    () => (this.summary()?.byPaymentMethod.yape ?? 0) + (this.summary()?.byPaymentMethod.plin ?? 0),
  );

  readonly isToday = computed(() => {
    const today = new Date();
    const sel = this.selectedDate();
    return (
      sel.getFullYear() === today.getFullYear() &&
      sel.getMonth() === today.getMonth() &&
      sel.getDate() === today.getDate()
    );
  });

  readonly formattedDate = computed(() =>
    this.selectedDate().toLocaleDateString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
  );

  readonly comparison = computed((): { delta: number; pct: number | null } | null => {
    const data = this.weeklyData();
    if (data.length < 2) return null;
    const current = data[data.length - 1].total;
    const previous = data[data.length - 2].total;
    if (current === 0 && previous === 0) return null;
    const delta = current - previous;
    const pct = previous > 0 ? (delta / previous) * 100 : null;
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
        if (day) this.goToDate(day.date);
      }
    },
  };

  async ngOnInit() {
    await this.loadData(this.selectedDate());
  }

  async loadData(date: Date) {
    this.loading.set(true);
    try {
      const [summary, sales, weekly] = await Promise.all([
        this.getDailySummaryUseCase.execute(date),
        this.saleRepo.getByDate(date),
        this.getDailySummaryUseCase.getWeeklyTotals(date),
      ]);
      this.summary.set(summary);
      this.allSales.set(sales);
      this.weeklyData.set(weekly);
    } finally {
      this.loading.set(false);
    }
  }

  prevDay() {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d);
    this.loadData(d);
  }

  nextDay() {
    if (this.isToday()) return;
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d);
    this.loadData(d);
  }

  goToToday() {
    const today = new Date();
    this.selectedDate.set(today);
    this.loadData(today);
  }

  goToDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    this.selectedDate.set(date);
    this.loadData(date);
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  paymentLabel(method: string): string {
    const labels: Record<string, string> = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin' };
    return labels[method] ?? method;
  }
}
