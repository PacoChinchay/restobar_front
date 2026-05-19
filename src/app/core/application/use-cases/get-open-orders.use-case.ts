import { inject, Injectable } from '@angular/core';
import { Order } from '../../domain/models/order.model';
import { OrderRepositoryPort } from '../../domain/ports/order.repository.port';

@Injectable({ providedIn: 'root' })
export class GetOpenOrdersUseCase {
  private repo = inject(OrderRepositoryPort);
  execute(): Promise<Order[]> { return this.repo.getOpen(); }
}
