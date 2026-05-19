import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Category } from '../../../core/domain/models/category.model';
import { CategoryRepositoryPort } from '../../../core/domain/ports/category.repository.port';
import { API_BASE } from './api.base';

@Injectable()
export class HttpCategoryRepository extends CategoryRepositoryPort {
  private readonly http = inject(HttpClient);

  getAll(): Promise<Category[]> {
    return firstValueFrom(this.http.get<Category[]>(`${API_BASE}/api/Categories`));
  }

  create(name: string): Promise<Category> {
    return firstValueFrom(this.http.post<Category>(`${API_BASE}/api/Categories`, { name }));
  }

  update(id: number, name: string): Promise<Category> {
    return firstValueFrom(this.http.put<Category>(`${API_BASE}/api/Categories/${id}`, { name }));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_BASE}/api/Categories/${id}`));
  }
}
