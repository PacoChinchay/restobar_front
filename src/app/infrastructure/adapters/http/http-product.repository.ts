import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Product, ProductCategory } from '../../../core/domain/models/product.model';
import { ProductRepositoryPort } from '../../../core/domain/ports/product.repository.port';
import { API_BASE } from './api.base';

@Injectable()
export class HttpProductRepository extends ProductRepositoryPort {
  private readonly http = inject(HttpClient);

  getAll(): Promise<Product[]> {
    return firstValueFrom(this.http.get<Product[]>(`${API_BASE}/api/Products/all`));
  }

  getActive(): Promise<Product[]> {
    return firstValueFrom(this.http.get<Product[]>(`${API_BASE}/api/Products`));
  }

  create(data: { name: string; price: number; category: ProductCategory }): Promise<Product> {
    return firstValueFrom(this.http.post<Product>(`${API_BASE}/api/Products`, data));
  }

  update(id: number, data: { name: string; price: number; category: ProductCategory }): Promise<Product> {
    return firstValueFrom(this.http.put<Product>(`${API_BASE}/api/Products/${id}`, data));
  }
}
