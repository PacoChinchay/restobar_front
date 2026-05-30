import { WaiterDaySummary, WaiterWeekSummary } from '../models/waiter-report.model';

export abstract class WaiterReportPort {
  abstract getWeeklyStats(endDate: Date): Promise<WaiterWeekSummary>;
  abstract getDailyStats(date: Date): Promise<WaiterDaySummary>;
}
