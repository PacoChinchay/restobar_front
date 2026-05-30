import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WaiterDaySummary, WaiterWeekSummary } from '../../../core/domain/models/waiter-report.model';
import { WaiterReportPort } from '../../../core/domain/ports/waiter-report.port';
import { API_BASE } from './api.base';

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class HttpWaiterReportAdapter extends WaiterReportPort {
  private readonly http = inject(HttpClient);

  getWeeklyStats(endDate: Date): Promise<WaiterWeekSummary> {
    return firstValueFrom(
      this.http.get<WaiterWeekSummary>(`${API_BASE}/api/reports/waiters/weekly`, {
        params: { endDate: toDateParam(endDate) },
      }),
    );
  }

  getDailyStats(date: Date): Promise<WaiterDaySummary> {
    return firstValueFrom(
      this.http.get<WaiterDaySummary>(`${API_BASE}/api/reports/waiters/daily`, {
        params: { date: toDateParam(date) },
      }),
    );
  }
}
