import { inject, Injectable } from '@angular/core';
import { Order } from '../../domain/models/order.model';
import { OrderRepositoryPort } from '../../domain/ports/order.repository.port';

@Injectable({ providedIn: 'root' })
export class AddOrderItemUseCase {
  private repo = inject(OrderRepositoryPort);
  execute(orderId: number, item: { productId: number; productName: string; unitPrice: number; quantity: number }): Promise<Order> {
    return this.repo.addItem(orderId, item);
  }
}
