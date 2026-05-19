import { inject, Injectable } from '@angular/core';
import { OrderRepositoryPort } from '../../domain/ports/order.repository.port';

@Injectable({ providedIn: 'root' })
export class RemoveOrderItemUseCase {
  private repo = inject(OrderRepositoryPort);
  execute(orderId: number, itemId: number): Promise<void> {
    return this.repo.removeItem(orderId, itemId);
  }
}
