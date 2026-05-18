import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Tooltip } from 'primeng/tooltip';
import { Product } from '../../../core/domain/models/product.model';
import { GetProductsUseCase } from '../../../core/application/use-cases/get-products.use-case';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [Button, Divider, Tooltip, DecimalPipe],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private getProducts = inject(GetProductsUseCase);

  readonly products = signal<Product[]>([]);

  readonly categories = computed(() => [...new Set(this.products().map(p => p.category))]);

  readonly productsByCategory = computed(() => {
    const map: Record<string, Product[]> = {};
    for (const cat of this.categories()) {
      map[cat] = this.products().filter(p => p.category === cat);
    }
    return map;
  });

  async ngOnInit() {
    this.products.set(await this.getProducts.execute());
  }
}
