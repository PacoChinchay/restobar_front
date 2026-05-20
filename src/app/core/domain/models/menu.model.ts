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
  isActive: boolean;
  createdAt: string;
  items: MenuItemModel[];
}

export interface CreateMenuRequest {
  name: string;
  items: { productId: number; productName: string; unitPrice: number; quantity: number }[];
}
