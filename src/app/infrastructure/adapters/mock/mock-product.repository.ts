import { Injectable } from '@angular/core';
import { Product, ProductCategory } from '../../../core/domain/models/product.model';
import { ProductRepositoryPort } from '../../../core/domain/ports/product.repository.port';

const MOCK_PRODUCTS: Product[] = [
  { id: 1,  name: 'Lomo Saltado',    price: 18, category: 'Platos',  active: true },
  { id: 2,  name: 'Ceviche',         price: 22, category: 'Platos',  active: true },
  { id: 3,  name: 'Arroz con Pollo', price: 15, category: 'Platos',  active: true },
  { id: 4,  name: 'Ají de Gallina',  price: 16, category: 'Platos',  active: true },
  { id: 5,  name: 'Chicharrón',      price: 20, category: 'Platos',  active: true },
  { id: 6,  name: 'Aguadito',        price: 14, category: 'Platos',  active: true },
  { id: 7,  name: 'Gaseosa',         price: 5,  category: 'Bebidas', active: true },
  { id: 8,  name: 'Cerveza',         price: 8,  category: 'Bebidas', active: true },
  { id: 9,  name: 'Agua',            price: 3,  category: 'Bebidas', active: true },
  { id: 10, name: 'Arroz con Leche', price: 7,  category: 'Postres', active: true },
];

@Injectable()
export class MockProductRepository extends ProductRepositoryPort {
  private nextId = MOCK_PRODUCTS.length + 1;

  getAll(): Promise<Product[]> {
    return Promise.resolve([...MOCK_PRODUCTS]);
  }

  getActive(): Promise<Product[]> {
    return Promise.resolve(MOCK_PRODUCTS.filter(p => p.active));
  }

  create(data: { name: string; price: number; category: ProductCategory }): Promise<Product> {
    const product: Product = { ...data, id: this.nextId++, active: true };
    MOCK_PRODUCTS.push(product);
    return Promise.resolve(product);
  }

  update(_id: number, _data: { name: string; price: number; category: ProductCategory }): Promise<Product> {
    throw new Error('Not implemented');
  }
}
