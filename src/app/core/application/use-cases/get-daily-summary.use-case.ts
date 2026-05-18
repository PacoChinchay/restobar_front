import { inject, Injectable } from '@angular/core';
import { DailySummary } from '../../domain/models/sale.model';
import { SaleRepositoryPort } from '../../domain/ports/sale.repository.port';

@Injectable({ providedIn: 'root' })
export class GetDailySummaryUseCase {
  private repo = inject(SaleRepositoryPort);

  execute(date: Date): Promise<DailySummary> {
    return this.repo.getDailySummary(date);
  }
}
