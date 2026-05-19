import { inject, Injectable } from '@angular/core';
import { DailySummary, DailyTotal } from '../../domain/models/sale.model';
import { SaleRepositoryPort } from '../../domain/ports/sale.repository.port';

@Injectable({ providedIn: 'root' })
export class GetDailySummaryUseCase {
  private repo = inject(SaleRepositoryPort);

  execute(date: Date): Promise<DailySummary> {
    return this.repo.getDailySummary(date);
  }

  getWeeklyTotals(endDate: Date): Promise<DailyTotal[]> {
    return this.repo.getWeeklyTotals(endDate);
  }
}
