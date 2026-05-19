import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreateOrderRequest, Order, PayOrderRequest } from '../../../core/domain/models/order.model';
import { OrderRepositoryPort } from '../../../core/domain/ports/order.repository.port';
import { API_BASE } from './api.base';

@Injectable()
export class HttpOrderRepository extends OrderRepositoryPort {
  private readonly http = inject(HttpClient);

  getOpen(): Promise<Order[]> {
    return firstValueFrom(this.http.get<Order[]>(`${API_BASE}/api/Orders/open`));
  }

  getById(id: number): Promise<Order> {
    return firstValueFrom(this.http.get<Order>(`${API_BASE}/api/Orders/${id}`));
  }

  create(request: CreateOrderRequest): Promise<Order> {
    return firstValueFrom(this.http.post<Order>(`${API_BASE}/api/Orders`, request));
  }

  addItem(orderId: number, item: { productId: number; productName: string; unitPrice: number; quantity: number }): Promise<Order> {
    return firstValueFrom(this.http.post<Order>(`${API_BASE}/api/Orders/${orderId}/items`, item));
  }

  removeItem(orderId: number, itemId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_BASE}/api/Orders/${orderId}/items/${itemId}`));
  }

  updateItemQuantity(orderId: number, itemId: number, quantity: number): Promise<Order> {
    return firstValueFrom(this.http.patch<Order>(`${API_BASE}/api/Orders/${orderId}/items/${itemId}`, { quantity }));
  }

  pay(orderId: number, request: PayOrderRequest): Promise<Order> {
    return firstValueFrom(this.http.post<Order>(`${API_BASE}/api/Orders/${orderId}/pay`, request));
  }

  cancel(orderId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_BASE}/api/Orders/${orderId}`));
  }
}
