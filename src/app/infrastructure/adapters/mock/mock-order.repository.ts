import { Injectable } from '@angular/core';
import { CreateOrderRequest, Order, OrderItem, PayOrderRequest } from '../../../core/domain/models/order.model';
import { OrderRepositoryPort } from '../../../core/domain/ports/order.repository.port';

let mockOrders: Order[] = [];
let nextOrderId = 1;
let nextItemId = 100;

@Injectable()
export class MockOrderRepository extends OrderRepositoryPort {
  getOpen(): Promise<Order[]> {
    return Promise.resolve(mockOrders.filter(o => o.status === 'open'));
  }

  getById(id: number): Promise<Order> {
    const order = mockOrders.find(o => o.id === id);
    if (!order) return Promise.reject(new Error('Order not found'));
    return Promise.resolve(order);
  }

  create(request: CreateOrderRequest): Promise<Order> {
    const items: OrderItem[] = request.items.map(i => ({
      id: nextItemId++,
      productId: i.productId,
      productName: i.productName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      subtotal: i.unitPrice * i.quantity,
    }));
    const order: Order = {
      id: nextOrderId++,
      tableNumber: request.tableNumber,
      status: 'open',
      items,
      totalAmount: items.reduce((s, i) => s + i.subtotal, 0),
      createdAt: new Date(),
    };
    mockOrders.push(order);
    return Promise.resolve(order);
  }

  addItem(orderId: number, item: { productId: number; productName: string; unitPrice: number; quantity: number }): Promise<Order> {
    const order = mockOrders.find(o => o.id === orderId)!;
    const existing = order.items.find(i => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
      existing.subtotal = existing.unitPrice * existing.quantity;
    } else {
      order.items.push({ id: nextItemId++, ...item, subtotal: item.unitPrice * item.quantity });
    }
    order.totalAmount = order.items.reduce((s, i) => s + i.subtotal, 0);
    return Promise.resolve(order);
  }

  removeItem(orderId: number, itemId: number): Promise<void> {
    const order = mockOrders.find(o => o.id === orderId)!;
    order.items = order.items.filter(i => i.id !== itemId);
    order.totalAmount = order.items.reduce((s, i) => s + i.subtotal, 0);
    return Promise.resolve();
  }

  updateItemQuantity(orderId: number, itemId: number, quantity: number): Promise<Order> {
    const order = mockOrders.find(o => o.id === orderId)!;
    const item = order.items.find(i => i.id === itemId)!;
    item.quantity = quantity;
    item.subtotal = item.unitPrice * quantity;
    order.totalAmount = order.items.reduce((s, i) => s + i.subtotal, 0);
    return Promise.resolve(order);
  }

  pay(orderId: number, _request: PayOrderRequest): Promise<Order> {
    const order = mockOrders.find(o => o.id === orderId)!;
    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentMethod = _request.paymentMethod;
    return Promise.resolve(order);
  }

  cancel(orderId: number): Promise<void> {
    const order = mockOrders.find(o => o.id === orderId)!;
    order.status = 'cancelled';
    return Promise.resolve();
  }
}
