import { Injectable } from '@angular/core';
import { MenuModel, CreateMenuRequest, MenuType } from '../../../core/domain/models/menu.model';
import { MenuRepositoryPort } from '../../../core/domain/ports/menu.repository.port';

let MENUS: MenuModel[] = [];
let nextId = 1;
let nextItemId = 1;

@Injectable()
export class MockMenuRepository extends MenuRepositoryPort {
  getAll(): Promise<MenuModel[]> { return Promise.resolve([...MENUS]); }

  getActive(type: MenuType = 'daily'): Promise<MenuModel | null> {
    return Promise.resolve(MENUS.find(m => m.isActive && m.type === type) ?? null);
  }

  create(request: CreateMenuRequest): Promise<MenuModel> {
    const menu: MenuModel = {
      id: nextId++,
      name: request.name,
      type: request.type,
      isActive: false,
      createdAt: new Date().toISOString(),
      items: request.items.map(i => ({
        id: nextItemId++,
        productId: i.productId,
        productName: i.productName,
        unitPrice: i.unitPrice,
        initialQuantity: i.quantity,
        remainingQuantity: i.quantity,
      })),
    };
    MENUS.push(menu);
    return Promise.resolve(menu);
  }

  update(id: number, request: CreateMenuRequest): Promise<MenuModel> {
    const menu = MENUS.find(m => m.id === id)!;
    menu.name = request.name;
    menu.items = request.items.map(i => ({
      id: nextItemId++,
      productId: i.productId,
      productName: i.productName,
      unitPrice: i.unitPrice,
      initialQuantity: i.quantity,
      remainingQuantity: i.quantity,
    }));
    return Promise.resolve(menu);
  }

  delete(id: number): Promise<void> {
    MENUS = MENUS.filter(m => m.id !== id);
    return Promise.resolve();
  }

  activate(id: number): Promise<MenuModel> {
    const menu = MENUS.find(m => m.id === id)!;
    MENUS.forEach(m => { if (m.type === menu.type) m.isActive = false; });
    menu.isActive = true;
    return Promise.resolve(menu);
  }

  deactivate(id: number): Promise<void> {
    const menu = MENUS.find(m => m.id === id)!;
    menu.isActive = false;
    return Promise.resolve();
  }

  updateItemQuantity(menuId: number, itemId: number, quantity: number): Promise<MenuModel> {
    const menu = MENUS.find(m => m.id === menuId)!;
    const item = menu.items.find(i => i.id === itemId)!;
    item.remainingQuantity = Math.max(0, quantity);
    return Promise.resolve(menu);
  }
}
