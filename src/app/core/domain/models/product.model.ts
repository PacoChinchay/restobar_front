export type ProductCategory = 'Platos' | 'Bebidas' | 'Postres';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  active: boolean;
}
