import { inject, Injectable } from '@angular/core';
import { WaiterWeekSummary } from '../../domain/models/waiter-report.model';
import { WaiterReportPort } from '../../domain/ports/waiter-report.port';

@Injectable({ providedIn: 'root' })
export class GetWaiterReportUseCase {
  private repo = inject(WaiterReportPort);

  getWeeklyStats(endDate: Date): Promise<WaiterWeekSummary> {
    return this.repo.getWeeklyStats(endDate);
  }
}
