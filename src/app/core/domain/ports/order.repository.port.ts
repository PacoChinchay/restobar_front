import { Injectable } from '@angular/core';
import { CreateOrderRequest, Order, PayOrderRequest } from '../models/order.model';

@Injectable()
export abstract class OrderRepositoryPort {
  abstract getOpen(): Promise<Order[]>;
  abstract getById(id: number): Promise<Order>;
  abstract create(request: CreateOrderRequest): Promise<Order>;
  abstract addItem(orderId: number, item: { productId: number; productName: string; unitPrice: number; quantity: number }): Promise<Order>;
  abstract removeItem(orderId: number, itemId: number): Promise<void>;
  abstract updateItemQuantity(orderId: number, itemId: number, quantity: number): Promise<Order>;
  abstract pay(orderId: number, request: PayOrderRequest): Promise<Order>;
  abstract cancel(orderId: number): Promise<void>;
}
