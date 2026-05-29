import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CashMovement, CashSession } from '../../../core/domain/models/cash-session.model';
import { CashSessionPort } from '../../../core/domain/ports/cash-session.port';
import { API_BASE } from './api.base';

@Injectable()
export class HttpCashSessionAdapter extends CashSessionPort {
  private readonly http = inject(HttpClient);

  getToday(): Promise<CashSession | null> {
    return firstValueFrom(
      this.http.get<CashSession | null>(`${API_BASE}/api/cash-session/today`),
    );
  }

  open(initialAmount: number, openedBy: string): Promise<CashSession> {
    return firstValueFrom(
      this.http.post<CashSession>(`${API_BASE}/api/cash-session`, { initialAmount, openedBy }),
    );
  }

  addMovement(
    sessionId: number,
    movementType: 'ingreso' | 'egreso',
    amount: number,
    description: string,
    createdBy: string,
  ): Promise<CashMovement> {
    return firstValueFrom(
      this.http.post<CashMovement>(`${API_BASE}/api/cash-session/${sessionId}/movements`, {
        movementType,
        amount,
        description,
        createdBy,
      }),
    );
  }
}
