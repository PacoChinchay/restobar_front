import { Product, ProductCategory } from '../models/product.model';

export abstract class ProductRepositoryPort {
  abstract getAll(): Promise<Product[]>;
  abstract getActive(): Promise<Product[]>;
  abstract create(data: { name: string; price: number; category: ProductCategory }): Promise<Product>;
  abstract update(id: number, data: { name: string; price: number; category: ProductCategory }): Promise<Product>;
}
