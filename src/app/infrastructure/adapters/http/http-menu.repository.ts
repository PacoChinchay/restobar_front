import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MenuModel, CreateMenuRequest } from '../../../core/domain/models/menu.model';
import { MenuRepositoryPort } from '../../../core/domain/ports/menu.repository.port';
import { API_BASE } from './api.base';

@Injectable()
export class HttpMenuRepository extends MenuRepositoryPort {
  private readonly http = inject(HttpClient);

  getAll(): Promise<MenuModel[]> {
    return firstValueFrom(this.http.get<MenuModel[]>(`${API_BASE}/api/Menus`));
  }

  getActive(): Promise<MenuModel | null> {
    return firstValueFrom(
      this.http.get<MenuModel | null>(`${API_BASE}/api/Menus/active`, { observe: 'response' })
    ).then(r => r.status === 204 ? null : r.body);
  }

  create(request: CreateMenuRequest): Promise<MenuModel> {
    return firstValueFrom(this.http.post<MenuModel>(`${API_BASE}/api/Menus`, request));
  }

  update(id: number, request: CreateMenuRequest): Promise<MenuModel> {
    return firstValueFrom(this.http.put<MenuModel>(`${API_BASE}/api/Menus/${id}`, request));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_BASE}/api/Menus/${id}`));
  }

  activate(id: number): Promise<MenuModel> {
    return firstValueFrom(this.http.post<MenuModel>(`${API_BASE}/api/Menus/${id}/activate`, {}));
  }

  deactivate(id: number): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${API_BASE}/api/Menus/${id}/deactivate`, {}));
  }

  updateItemQuantity(menuId: number, itemId: number, quantity: number): Promise<MenuModel> {
    return firstValueFrom(
      this.http.patch<MenuModel>(`${API_BASE}/api/Menus/${menuId}/items/${itemId}/quantity`, { quantity })
    );
  }
}
