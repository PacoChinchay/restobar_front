import { CashMovement, CashSession } from '../models/cash-session.model';

export abstract class CashSessionPort {
  abstract getToday(): Promise<CashSession | null>;
  abstract getByDate(date: Date): Promise<CashSession | null>;
  abstract open(initialAmount: number, openedBy: string): Promise<CashSession>;
  abstract addMovement(
    sessionId: number,
    movementType: 'ingreso' | 'egreso',
    amount: number,
    description: string,
    createdBy: string,
  ): Promise<CashMovement>;
}
