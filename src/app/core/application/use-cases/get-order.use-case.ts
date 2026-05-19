import { inject, Injectable } from '@angular/core';
import { Order } from '../../domain/models/order.model';
import { OrderRepositoryPort } from '../../domain/ports/order.repository.port';

@Injectable({ providedIn: 'root' })
export class GetOrderUseCase {
  private repo = inject(OrderRepositoryPort);
  execute(id: number): Promise<Order> { return this.repo.getById(id); }
}
