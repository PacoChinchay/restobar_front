import { inject, Injectable } from '@angular/core';
import { CashSessionPort } from '../../domain/ports/cash-session.port';

@Injectable({ providedIn: 'root' })
export class GetCashSessionUseCase {
  private port = inject(CashSessionPort);
  execute() { return this.port.getToday(); }
}
