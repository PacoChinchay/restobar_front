import { inject, Injectable } from '@angular/core';
import { Sale } from '../../domain/models/sale.model';
import { SaleRepositoryPort } from '../../domain/ports/sale.repository.port';

@Injectable({ providedIn: 'root' })
export class RegisterSaleUseCase {
  private repo = inject(SaleRepositoryPort);

  execute(dto: Omit<Sale, 'id'>): Promise<Sale> {
    return this.repo.save(dto);
  }
}
