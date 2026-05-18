import { inject, Injectable } from '@angular/core';
import { Product, ProductCategory } from '../../domain/models/product.model';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

@Injectable({ providedIn: 'root' })
export class CreateProductUseCase {
  private repo = inject(ProductRepositoryPort);

  execute(data: { name: string; price: number; category: ProductCategory }): Promise<Product> {
    return this.repo.create(data);
  }
}
