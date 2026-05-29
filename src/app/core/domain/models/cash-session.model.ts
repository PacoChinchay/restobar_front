export interface CashMovement {
  id: number;
  movementType: 'ingreso' | 'egreso';
  amount: number;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface CashSession {
  id: number;
  date: string;
  initialAmount: number;
  openedBy: string;
  openedAt: string;
  movements: CashMovement[];
  balance: number;
}
