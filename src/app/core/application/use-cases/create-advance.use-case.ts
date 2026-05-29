import { inject, Injectable } from '@angular/core';
import { SalaryAdvancePort } from '../../domain/ports/salary-advance.port';

@Injectable({ providedIn: 'root' })
export class CreateAdvanceUseCase {
  private port = inject(SalaryAdvancePort);
  execute(userId: string, employeeName: string, amount: number, notes: string | null, registeredBy: string) {
    return this.port.create(userId, employeeName, amount, notes, registeredBy);
  }
}
