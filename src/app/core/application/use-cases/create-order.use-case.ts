import { inject, Injectable } from '@angular/core';
import { CreateOrderRequest, Order } from '../../domain/models/order.model';
import { OrderRepositoryPort } from '../../domain/ports/order.repository.port';

@Injectable({ providedIn: 'root' })
export class CreateOrderUseCase {
  private repo = inject(OrderRepositoryPort);
  execute(request: CreateOrderRequest): Promise<Order> { return this.repo.create(request); }
}
