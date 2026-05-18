import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Product } from '../../../../core/domain/models/product.model';
import { PaymentMethod } from '../../../../core/domain/models/sale.model';
import { GetProductsUseCase } from '../../../../core/application/use-cases/get-products.use-case';
import { RegisterSaleUseCase } from '../../../../core/application/use-cases/register-sale.use-case';
import { AuthStore } from '../../../../core/application/auth.store';

@Component({
  selector: 'app-new-sale',
  standalone: true,
  imports: [Button, DecimalPipe],
  templateUrl: './new-sale.component.html',
  styleUrl: './new-sale.component.scss',
})
export class NewSaleComponent implements OnInit {
  private getProducts = inject(GetProductsUseCase);
  private registerSale = inject(RegisterSaleUseCase);
  private authStore = inject(AuthStore);
  private messageService = inject(MessageService);
  private router = inject(Router);

  readonly step = signal<1 | 2 | 3>(1);
  readonly products = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);
  readonly quantity = signal(1);
  readonly paymentMethod = signal<PaymentMethod | null>(null);
  readonly saving = signal(false);

  readonly categories = computed(() => [
    ...new Set(this.products().map(p => p.category)),
  ]);

  readonly productsByCategory = computed(() => {
    const map: Record<string, Product[]> = {};
    for (const cat of this.categories()) {
      map[cat] = this.products().filter(p => p.category === cat);
    }
    return map;
  });

  readonly total = computed(() => (this.selectedProduct()?.price ?? 0) * this.quantity());

  async ngOnInit() {
    this.products.set(await this.getProducts.execute());
  }

  selectProduct(p: Product) {
    this.selectedProduct.set(p);
  }

  decreaseQty() {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  increaseQty() {
    this.quantity.update(q => q + 1);
  }

  selectPayment(method: PaymentMethod) {
    this.paymentMethod.set(method);
  }

  async confirmSale() {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      await this.registerSale.execute({
        productId: this.selectedProduct()!.id,
        productName: this.selectedProduct()!.name,
        unitPrice: this.selectedProduct()!.price,
        quantity: this.quantity(),
        paymentMethod: this.paymentMethod()!,
        total: this.total(),
        registeredAt: new Date(),
        registeredBy: this.authStore.currentUser()?.name ?? 'Desconocido',
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Venta registrada',
        detail: `${this.selectedProduct()!.name} — S/ ${this.total().toFixed(2)}`,
        life: 3000,
      });
      setTimeout(() => this.router.navigate(['/dashboard']), 1200);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error al registrar',
        detail: 'No se pudo registrar la venta. Verifique la conexión e intente nuevamente.',
        life: 5000,
      });
    } finally {
      this.saving.set(false);
    }
  }

  paymentLabel(method: PaymentMethod | null): string {
    if (!method) return '';
    const labels: Record<PaymentMethod, string> = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin' };
    return labels[method];
  }
}
