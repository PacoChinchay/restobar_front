import { MenuModel, CreateMenuRequest, MenuType } from '../models/menu.model';

export abstract class MenuRepositoryPort {
  abstract getAll(): Promise<MenuModel[]>;
  abstract getActive(type?: MenuType): Promise<MenuModel | null>;
  abstract create(request: CreateMenuRequest): Promise<MenuModel>;
  abstract update(id: number, request: CreateMenuRequest): Promise<MenuModel>;
  abstract delete(id: number): Promise<void>;
  abstract activate(id: number): Promise<MenuModel>;
  abstract deactivate(id: number): Promise<void>;
  abstract updateItemQuantity(menuId: number, itemId: number, quantity: number): Promise<MenuModel>;
}
