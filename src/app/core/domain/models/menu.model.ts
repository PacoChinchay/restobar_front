export type MenuType = 'daily' | 'food' | 'drinks';

export interface MenuItemModel {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  initialQuantity: number;
  remainingQuantity: number;
}

export interface MenuModel {
  id: number;
  name: string;
  type: MenuType;
  isActive: boolean;
  createdAt: string;
  items: MenuItemModel[];
}

export interface CreateMenuRequest {
  name: string;
  type: MenuType;
  items: { productId: number; productName: string; unitPrice: number; quantity: number }[];
}
