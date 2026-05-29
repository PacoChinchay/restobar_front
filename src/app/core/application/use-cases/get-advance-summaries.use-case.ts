import { inject, Injectable } from '@angular/core';
import { SalaryAdvancePort } from '../../domain/ports/salary-advance.port';

@Injectable({ providedIn: 'root' })
export class GetAdvanceSummariesUseCase {
  private port = inject(SalaryAdvancePort);
  execute(weekOf?: Date) { return this.port.getSummaries(weekOf); }
}
