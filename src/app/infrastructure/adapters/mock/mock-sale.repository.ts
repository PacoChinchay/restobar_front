import { Injectable } from '@angular/core';
import { DailySummary, DailyTotal, PaymentMethod, Sale } from '../../../core/domain/models/sale.model';
import { SaleRepositoryPort } from '../../../core/domain/ports/sale.repository.port';

const today = new Date();
const d = (h: number, m: number) => { const dt = new Date(today); dt.setHours(h, m, 0, 0); return dt; };

let mockSales: Sale[] = [
  { id: 1, productId: 1,  productName: 'Lomo Saltado',    unitPrice: 18, quantity: 2, paymentMethod: 'efectivo', total: 36, registeredAt: d(11, 0),  registeredBy: 'Cajero' },
  { id: 2, productId: 7,  productName: 'Gaseosa',          unitPrice: 5,  quantity: 3, paymentMethod: 'yape',     total: 15, registeredAt: d(12, 30), registeredBy: 'Cajero' },
  { id: 3, productId: 2,  productName: 'Ceviche',          unitPrice: 22, quantity: 1, paymentMethod: 'plin',     total: 22, registeredAt: d(13, 15), registeredBy: 'Administrador' },
  { id: 4, productId: 8,  productName: 'Cerveza',          unitPrice: 8,  quantity: 2, paymentMethod: 'efectivo', total: 16, registeredAt: d(14, 0),  registeredBy: 'Cajero' },
  { id: 5, productId: 10, productName: 'Arroz con Leche',  unitPrice: 7,  quantity: 2, paymentMethod: 'yape',     total: 14, registeredAt: d(15, 0),  registeredBy: 'Cajero' },
];

@Injectable()
export class MockSaleRepository extends SaleRepositoryPort {
  async save(sale: Omit<Sale, 'id'>): Promise<Sale> {
    const newSale: Sale = { ...sale, id: Date.now() };
    mockSales.push(newSale);
    return newSale;
  }

  async getByDate(date: Date): Promise<Sale[]> {
    return mockSales.filter(s => s.registeredAt.toDateString() === date.toDateString());
  }

  async getDailySummary(date: Date): Promise<DailySummary> {
    const sales = await this.getByDate(date);
    const byPaymentMethod: Record<PaymentMethod, number> = { efectivo: 0, yape: 0, plin: 0 };
    for (const s of sales) byPaymentMethod[s.paymentMethod] += s.total;
    return {
      totalAmount: sales.reduce((sum, s) => sum + s.total, 0),
      totalSales: sales.length,
      byPaymentMethod,
      recentSales: [...sales]
        .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
        .slice(0, 5),
    };
  }

  async getWeeklyTotals(endDate: Date): Promise<DailyTotal[]> {
    const result: DailyTotal[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const sales = await this.getByDate(d);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      result.push({ date: `${y}-${m}-${day}`, total: sales.reduce((s, x) => s + x.total, 0) });
    }
    return result;
  }
}
