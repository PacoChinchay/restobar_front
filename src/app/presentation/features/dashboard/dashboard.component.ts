import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { DailySummary } from '../../../core/domain/models/sale.model';
import { GetDailySummaryUseCase } from '../../../core/application/use-cases/get-daily-summary.use-case';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Card, Button, RouterLink, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private getDailySummary = inject(GetDailySummaryUseCase);

  readonly summary = signal<DailySummary | null>(null);
  readonly loading = signal(true);

  readonly digital = computed(
    () => (this.summary()?.byPaymentMethod.yape ?? 0) + (this.summary()?.byPaymentMethod.plin ?? 0),
  );

  async ngOnInit() {
    this.summary.set(await this.getDailySummary.execute(new Date()));
    this.loading.set(false);
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  paymentLabel(method: string): string {
    const labels: Record<string, string> = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin' };
    return labels[method] ?? method;
  }
}
