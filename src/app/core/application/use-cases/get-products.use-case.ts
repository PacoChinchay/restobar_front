import { inject, Injectable } from '@angular/core';
import { Product } from '../../domain/models/product.model';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

@Injectable({ providedIn: 'root' })
export class GetProductsUseCase {
  private repo = inject(ProductRepositoryPort);

  execute(): Promise<Product[]> {
    return this.repo.getActive();
  }
}
