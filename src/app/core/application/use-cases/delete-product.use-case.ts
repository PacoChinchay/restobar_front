import { inject, Injectable } from '@angular/core';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

@Injectable({ providedIn: 'root' })
export class DeleteProductUseCase {
  private repo = inject(ProductRepositoryPort);

  execute(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}
