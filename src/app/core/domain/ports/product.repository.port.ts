import { Product } from '../models/product.model';

export abstract class ProductRepositoryPort {
  abstract getAll(): Promise<Product[]>;
  abstract getActive(): Promise<Product[]>;
}
