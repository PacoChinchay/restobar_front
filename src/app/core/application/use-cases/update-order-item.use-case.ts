import { inject, Injectable } from '@angular/core';
import { Order } from '../../domain/models/order.model';
import { OrderRepositoryPort } from '../../domain/ports/order.repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateOrderItemUseCase {
  private repo = inject(OrderRepositoryPort);
  execute(orderId: number, itemId: number, quantity: number): Promise<Order> {
    return this.repo.updateItemQuantity(orderId, itemId, quantity);
  }
}
