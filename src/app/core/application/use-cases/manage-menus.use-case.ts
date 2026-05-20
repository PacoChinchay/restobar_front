import { inject, Injectable } from '@angular/core';
import { MenuRepositoryPort } from '../../domain/ports/menu.repository.port';
import { CreateMenuRequest, MenuModel } from '../../domain/models/menu.model';

@Injectable({ providedIn: 'root' })
export class ManageMenusUseCase {
  private repo = inject(MenuRepositoryPort);

  getAll(): Promise<MenuModel[]> { return this.repo.getAll(); }
  getActive(): Promise<MenuModel | null> { return this.repo.getActive(); }
  create(req: CreateMenuRequest): Promise<MenuModel> { return this.repo.create(req); }
  update(id: number, req: CreateMenuRequest): Promise<MenuModel> { return this.repo.update(id, req); }
  delete(id: number): Promise<void> { return this.repo.delete(id); }
  activate(id: number): Promise<MenuModel> { return this.repo.activate(id); }
  deactivate(id: number): Promise<void> { return this.repo.deactivate(id); }
  updateItemQuantity(menuId: number, itemId: number, qty: number): Promise<MenuModel> {
    return this.repo.updateItemQuantity(menuId, itemId, qty);
  }
}
