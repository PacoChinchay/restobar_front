import { inject, Injectable } from '@angular/core';
import { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';

@Injectable({ providedIn: 'root' })
export class DeleteCategoryUseCase {
  private repo = inject(CategoryRepositoryPort);
  execute(id: number) { return this.repo.delete(id); }
}
