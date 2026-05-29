import { EmployeeAdvanceSummary, SalaryAdvance } from '../models/salary-advance.model';

export abstract class SalaryAdvancePort {
  abstract getSummaries(weekOf?: Date): Promise<EmployeeAdvanceSummary[]>;
  abstract create(
    userId: string,
    employeeName: string,
    amount: number,
    notes: string | null,
    registeredBy: string,
  ): Promise<SalaryAdvance>;
}
