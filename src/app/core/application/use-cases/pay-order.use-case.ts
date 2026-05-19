import { inject, Injectable } from '@angular/core';
import { Order, PayOrderRequest } from '../../domain/models/order.model';
import { OrderRepositoryPort } from '../../domain/ports/order.repository.port';

@Injectable({ providedIn: 'root' })
export class PayOrderUseCase {
  private repo = inject(OrderRepositoryPort);
  execute(orderId: number, request: PayOrderRequest): Promise<Order> {
    return this.repo.pay(orderId, request);
  }
}
