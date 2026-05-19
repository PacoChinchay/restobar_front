import { inject, Injectable } from '@angular/core';
import { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateCategoryUseCase {
  private repo = inject(CategoryRepositoryPort);
  execute(id: number, name: string) { return this.repo.update(id, name); }
}
