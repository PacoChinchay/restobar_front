import { DailySummary, DailyTotal, Sale } from '../models/sale.model';

export abstract class SaleRepositoryPort {
  abstract save(sale: Omit<Sale, 'id'>): Promise<Sale>;
  abstract getByDate(date: Date): Promise<Sale[]>;
  abstract getDailySummary(date: Date): Promise<DailySummary>;
  abstract getWeeklyTotals(endDate: Date): Promise<DailyTotal[]>;
}
