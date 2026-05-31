import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DailySummary, DailyTotal, PaymentMethod, Sale } from '../../../core/domain/models/sale.model';
import { SaleRepositoryPort } from '../../../core/domain/ports/sale.repository.port';
import { API_BASE } from './api.base';

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSale(dto: any): Sale {
  return {
    ...dto,
    registeredAt: new Date(dto.registeredAt),
    // Normaliza a minúsculas por si el backend serializa "Efectivo" en vez de "efectivo"
    paymentMethod: (dto.paymentMethod as string).toLowerCase() as PaymentMethod,
  };
}

@Injectable()
export class HttpSaleRepository extends SaleRepositoryPort {
  private readonly http = inject(HttpClient);

  async save(sale: Omit<Sale, 'id'>): Promise<Sale> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dto = await firstValueFrom(this.http.post<any>(`${API_BASE}/api/Sales`, sale));
    return mapSale(dto);
  }

  async getByDate(date: Date): Promise<Sale[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dtos = await firstValueFrom(
      this.http.get<any[]>(`${API_BASE}/api/Sales`, { params: { date: toDateParam(date) } }),
    );
    return dtos.map(mapSale);
  }

  async getDailySummary(date: Date): Promise<DailySummary> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dto = await firstValueFrom(
      this.http.get<any>(`${API_BASE}/api/Sales/summary`, { params: { date: toDateParam(date) } }),
    );
    return {
      totalAmount: dto.totalAmount,
      totalSales: dto.totalSales,
      byPaymentMethod: {
        efectivo:      dto.byPaymentMethod?.efectivo      ?? 0,
        yape:          dto.byPaymentMethod?.yape          ?? 0,
        plin:          dto.byPaymentMethod?.plin          ?? 0,
        transferencia: dto.byPaymentMethod?.transferencia ?? 0,
      },
      recentSales: (dto.recentSales ?? []).map(mapSale),
    };
  }

  getWeeklyTotals(endDate: Date): Promise<DailyTotal[]> {
    return firstValueFrom(
      this.http.get<DailyTotal[]>(`${API_BASE}/api/Sales/weekly`, { params: { endDate: toDateParam(endDate) } }),
    );
  }
}
