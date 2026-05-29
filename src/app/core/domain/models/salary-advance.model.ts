export interface SalaryAdvance {
  id: number;
  userId: string;
  employeeName: string;
  amount: number;
  date: string;
  notes: string | null;
  registeredBy: string;
  createdAt: string;
}

export interface EmployeeAdvanceSummary {
  userId: string;
  name: string;
  role: string;
  monthlySalary: number;
  weeklySalary: number;
  advancedThisWeek: number;
  remaining: number;
  weekAdvances: SalaryAdvance[];
}
