import { inject, Injectable } from '@angular/core';
import { OrderRepositoryPort } from '../../domain/ports/order.repository.port';

@Injectable({ providedIn: 'root' })
export class CancelOrderUseCase {
  private repo = inject(OrderRepositoryPort);
  execute(orderId: number): Promise<void> { return this.repo.cancel(orderId); }
}
