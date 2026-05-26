import { inject, Injectable } from '@angular/core';
import { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';

@Injectable({ providedIn: 'root' })
export class CreateCategoryUseCase {
  private repo = inject(CategoryRepositoryPort);
  execute(name: string, isDrink: boolean) { return this.repo.create(name, isDrink); }
}
