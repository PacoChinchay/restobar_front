import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { DailySummary, Sale } from '../../../core/domain/models/sale.model';
import { GetDailySummaryUseCase } from '../../../core/application/use-cases/get-daily-summary.use-case';
import { SaleRepositoryPort } from '../../../core/domain/ports/sale.repository.port';

@Component({
  selector: 'app-cash-report',
  standalone: true,
  imports: [Button, TableModule, Tooltip, DecimalPipe],
  templateUrl: './cash-report.component.html',
  styleUrl: './cash-report.component.scss',
})
export class CashReportComponent implements OnInit {
  private getDailySummary = inject(GetDailySummaryUseCase);
  private saleRepo = inject(SaleRepositoryPort);

  readonly summary = signal<DailySummary | null>(null);
  readonly allSales = signal<Sale[]>([]);

  readonly digital = computed(
    () => (this.summary()?.byPaymentMethod.yape ?? 0) + (this.summary()?.byPaymentMethod.plin ?? 0),
  );

  async ngOnInit() {
    const today = new Date();
    const [summary, sales] = await Promise.all([
      this.getDailySummary.execute(today),
      this.saleRepo.getByDate(today),
    ]);
    this.summary.set(summary);
    this.allSales.set(sales);
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  paymentLabel(method: string): string {
    const labels: Record<string, string> = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin' };
    return labels[method] ?? method;
  }
}
