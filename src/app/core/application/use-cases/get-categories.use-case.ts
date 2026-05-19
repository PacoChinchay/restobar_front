import { inject, Injectable } from '@angular/core';
import { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';

@Injectable({ providedIn: 'root' })
export class GetCategoriesUseCase {
  private repo = inject(CategoryRepositoryPort);
  execute() { return this.repo.getAll(); }
}
