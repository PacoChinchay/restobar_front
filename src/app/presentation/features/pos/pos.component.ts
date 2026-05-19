import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Product } from '../../../core/domain/models/product.model';
import { Order, OrderItem } from '../../../core/domain/models/order.model';
import { GetProductsUseCase } from '../../../core/application/use-cases/get-products.use-case';
import { GetCategoriesUseCase } from '../../../core/application/use-cases/get-categories.use-case';
import { CreateOrderUseCase } from '../../../core/application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../../core/application/use-cases/get-order.use-case';
import { AddOrderItemUseCase } from '../../../core/application/use-cases/add-order-item.use-case';
import { RemoveOrderItemUseCase } from '../../../core/application/use-cases/remove-order-item.use-case';
import { UpdateOrderItemUseCase } from '../../../core/application/use-cases/update-order-item.use-case';

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [Button, DecimalPipe],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private getProducts = inject(GetProductsUseCase);
  private getCategories = inject(GetCategoriesUseCase);
  private createOrder = inject(CreateOrderUseCase);
  private getOrder = inject(GetOrderUseCase);
  private addOrderItem = inject(AddOrderItemUseCase);
  private removeOrderItem = inject(RemoveOrderItemUseCase);
  private updateOrderItem = inject(UpdateOrderItemUseCase);
  private messageService = inject(MessageService);

  readonly editingOrderId = signal<number | null>(null);
  readonly editingOrder = signal<Order | null>(null);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<string[]>([]);
  readonly selectedCategory = signal<string>('');
  readonly tableNumber = signal(1);
  readonly cart = signal<CartItem[]>([]);
  readonly saving = signal(false);

  readonly filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    return cat ? this.products().filter(p => p.category === cat) : this.products();
  });

  readonly cartTotal = computed(() =>
    this.cart().reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  );

  readonly isEditing = computed(() => this.editingOrderId() !== null);

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const [products, cats] = await Promise.all([
      this.getProducts.execute(),
      this.getCategories.execute(),
    ]);
    this.products.set(products.filter(p => p.active));
    const catNames = cats.map(c => c.name);
    this.categories.set(catNames);
    if (catNames.length) this.selectedCategory.set(catNames[0]);

    if (idParam) {
      const id = Number(idParam);
      this.editingOrderId.set(id);
      const order = await this.getOrder.execute(id);
      this.editingOrder.set(order);
      this.tableNumber.set(order.tableNumber);
      this.cart.set(order.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })));
    }
  }

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  addToCart(product: Product) {
    const existing = this.cart().find(i => i.productId === product.id);
    if (existing) {
      this.cart.update(items =>
        items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i),
      );
    } else {
      this.cart.update(items => [...items, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
      }]);
    }
  }

  decreaseQty(item: CartItem) {
    if (item.quantity <= 1) {
      this.removeFromCart(item);
    } else {
      this.cart.update(items =>
        items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity - 1 } : i),
      );
    }
  }

  increaseQty(item: CartItem) {
    this.cart.update(items =>
      items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i),
    );
  }

  removeFromCart(item: CartItem) {
    this.cart.update(items => items.filter(i => i.productId !== item.productId));
  }

  async saveOrder() {
    if (this.cart().length === 0 || this.saving()) return;
    this.saving.set(true);
    try {
      if (this.isEditing()) {
        await this.syncEditedOrder();
      } else {
        await this.createOrder.execute({
          tableNumber: this.tableNumber(),
          items: this.cart().map(i => ({
            productId: i.productId,
            productName: i.productName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
        });
      }
      this.messageService.add({
        severity: 'success',
        summary: this.isEditing() ? 'Comanda actualizada' : 'Comanda guardada',
        detail: `Mesa ${this.tableNumber()} — ${this.cart().length} producto${this.cart().length !== 1 ? 's' : ''}`,
        life: 3000,
      });
      this.router.navigate(['/orders']);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo guardar la comanda.',
        life: 5000,
      });
    } finally {
      this.saving.set(false);
    }
  }

  private async syncEditedOrder() {
    const orderId = this.editingOrderId()!;
    const original = this.editingOrder()!;
    const current = this.cart();

    for (const orig of original.items) {
      const inCart = current.find(c => c.productId === orig.productId);
      if (!inCart) {
        await this.removeOrderItem.execute(orderId, orig.id);
      } else if (inCart.quantity !== orig.quantity) {
        const orderItem = original.items.find(i => i.productId === orig.productId)!;
        await this.updateOrderItem.execute(orderId, orderItem.id, inCart.quantity);
      }
    }

    for (const cartItem of current) {
      const wasInOriginal = original.items.some(i => i.productId === cartItem.productId);
      if (!wasInOriginal) {
        await this.addOrderItem.execute(orderId, {
          productId: cartItem.productId,
          productName: cartItem.productName,
          unitPrice: cartItem.unitPrice,
          quantity: cartItem.quantity,
        });
      }
    }
  }

  increaseTable() {
    this.tableNumber.update(n => n + 1);
  }

  decreaseTable() {
    if (this.tableNumber() > 1) this.tableNumber.update(n => n - 1);
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
