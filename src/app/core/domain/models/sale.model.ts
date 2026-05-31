export type PaymentMethod = 'efectivo' | 'yape' | 'plin' | 'transferencia';

export interface Sale {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  paymentMethod: PaymentMethod;
  total: number;
  registeredAt: Date;
  registeredBy: string;
}

export interface DailySummary {
  totalAmount: number;
  totalSales: number;
  byPaymentMethod: Record<PaymentMethod, number>;
  recentSales: Sale[];
}

export interface DailyTotal {
  date: string;
  total: number;
}
