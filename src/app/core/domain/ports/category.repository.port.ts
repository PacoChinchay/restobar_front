import { Category } from '../models/category.model';

export abstract class CategoryRepositoryPort {
  abstract getAll(): Promise<Category[]>;
  abstract create(name: string): Promise<Category>;
  abstract update(id: number, name: string): Promise<Category>;
  abstract delete(id: number): Promise<void>;
}
