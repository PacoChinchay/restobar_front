export interface WaiterWeekSummary {
  waiters: WaiterStats[];
  dailyTotals: DailyOrderCount[];
}

export interface WaiterStats {
  name: string;
  totalOrders: number;
  totalTables: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface DailyOrderCount {
  date: string;
  orderCount: number;
}

export interface WaiterDaySummary {
  date: string;
  waiters: WaiterStats[];
}
