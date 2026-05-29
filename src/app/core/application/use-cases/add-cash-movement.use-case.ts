import { inject, Injectable } from '@angular/core';
import { CashSessionPort } from '../../domain/ports/cash-session.port';

@Injectable({ providedIn: 'root' })
export class AddCashMovementUseCase {
  private port = inject(CashSessionPort);
  execute(
    sessionId: number,
    movementType: 'ingreso' | 'egreso',
    amount: number,
    description: string,
    createdBy: string,
  ) {
    return this.port.addMovement(sessionId, movementType, amount, description, createdBy);
  }
}
