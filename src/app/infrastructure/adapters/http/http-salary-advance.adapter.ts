import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmployeeAdvanceSummary, SalaryAdvance } from '../../../core/domain/models/salary-advance.model';
import { SalaryAdvancePort } from '../../../core/domain/ports/salary-advance.port';
import { API_BASE } from './api.base';

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Injectable()
export class HttpSalaryAdvanceAdapter extends SalaryAdvancePort {
  private readonly http = inject(HttpClient);

  getSummaries(weekOf?: Date): Promise<EmployeeAdvanceSummary[]> {
    const params: Record<string, string> = {};
    if (weekOf) params['weekOf'] = toDateParam(weekOf);
    return firstValueFrom(
      this.http.get<EmployeeAdvanceSummary[]>(`${API_BASE}/api/advances/summary`, { params }),
    );
  }

  create(userId: string, employeeName: string, amount: number, notes: string | null, registeredBy: string): Promise<SalaryAdvance> {
    return firstValueFrom(
      this.http.post<SalaryAdvance>(`${API_BASE}/api/advances`, { userId, employeeName, amount, notes, registeredBy }),
    );
  }
}
