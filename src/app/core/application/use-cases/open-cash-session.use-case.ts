import { inject, Injectable } from '@angular/core';
import { CashSessionPort } from '../../domain/ports/cash-session.port';

@Injectable({ providedIn: 'root' })
export class OpenCashSessionUseCase {
  private port = inject(CashSessionPort);
  execute(initialAmount: number, openedBy: string) {
    return this.port.open(initialAmount, openedBy);
  }
}
