import { inject, Injectable } from '@angular/core';
import { WaiterDaySummary, WaiterWeekSummary } from '../../domain/models/waiter-report.model';
import { WaiterReportPort } from '../../domain/ports/waiter-report.port';

@Injectable({ providedIn: 'root' })
export class GetWaiterReportUseCase {
  private repo = inject(WaiterReportPort);

  getWeeklyStats(endDate: Date): Promise<WaiterWeekSummary> {
    return this.repo.getWeeklyStats(endDate);
  }

  getDailyStats(date: Date): Promise<WaiterDaySummary> {
    return this.repo.getDailyStats(date);
  }
}
