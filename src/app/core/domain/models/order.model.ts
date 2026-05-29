export type OrderStatus = 'open' | 'paid' | 'cancelled';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  tableNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: Date;
  paidAt?: Date;
  paymentMethod?: string;
  createdBy?: string;
}

export interface CreateOrderRequest {
  tableNumber: number;
  items: { productId: number; productName: string; unitPrice: number; quantity: number; menuType?: string }[];
  createdBy?: string;
}

export interface PayOrderRequest {
  paymentMethod: string;
  registeredBy: string;
}
