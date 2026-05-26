import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { MenuModel, MenuItemModel, MenuType } from '../../../core/domain/models/menu.model';
import { ManageMenusUseCase } from '../../../core/application/use-cases/manage-menus.use-case';
import { CreateOrderUseCase } from '../../../core/application/use-cases/create-order.use-case';

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

const TAB_CONFIG: { type: MenuType; label: string; icon: string; empty: string }[] = [
  { type: 'food',   label: 'Carta',            icon: 'pi-list',         empty: 'No hay carta activa.' },
  { type: 'daily',  label: 'Menú del día',      icon: 'pi-calendar',     empty: 'No hay menú del día activo.' },
  { type: 'drinks', label: 'Carta de bebidas',  icon: 'pi-droplet-fill', empty: 'No hay carta de bebidas activa.' },
];

@Component({
  selector: 'app-carta-menu',
  standalone: true,
  imports: [Button, DecimalPipe],
  templateUrl: './carta-menu.component.html',
  styleUrl: './carta-menu.component.scss',
})
export class CartaMenuComponent implements OnInit {
  private manageMenus = inject(ManageMenusUseCase);
  private createOrder = inject(CreateOrderUseCase);
  private router = inject(Router);
  private messageService = inject(MessageService);

  readonly TAB_CONFIG = TAB_CONFIG;

  // ── Menu state ────────────────────────────────────────────────────────────
  readonly loading = signal(true);
  readonly activeTab = signal<MenuType>('food');
  readonly menus = signal<Record<MenuType, MenuModel | null>>({
    food: null,
    daily: null,
    drinks: null,
  });

  readonly currentMenu = computed(() => this.menus()[this.activeTab()]);

  readonly currentItems = computed(() => this.currentMenu()?.items ?? []);

  readonly emptyMessage = computed(() =>
    TAB_CONFIG.find(t => t.type === this.activeTab())?.empty ?? 'No hay carta activa.',
  );

  // ── Cart state ────────────────────────────────────────────────────────────
  readonly tableNumber = signal(1);
  readonly cart = signal<CartItem[]>([]);
  readonly saving = signal(false);

  readonly cartTotal = computed(() =>
    this.cart().reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  );

  menuStock(productId: number): number {
    const item = this.currentItems().find(i => i.productId === productId);
    return item?.remainingQuantity ?? 0;
  }

  cartQty(productId: number): number {
    return this.cart().find(i => i.productId === productId)?.quantity ?? 0;
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      const [food, daily, drinks] = await Promise.all([
        this.manageMenus.getActive('food' as MenuType),
        this.manageMenus.getActive('daily' as MenuType),
        this.manageMenus.getActive('drinks' as MenuType),
      ]);
      this.menus.set({ food, daily, drinks });
      // Auto-select first tab that has an active menu
      const firstActive = TAB_CONFIG.find(t => this.menus()[t.type] !== null);
      if (firstActive) this.activeTab.set(firstActive.type);
    } finally {
      this.loading.set(false);
    }
  }

  selectTab(type: MenuType) {
    this.activeTab.set(type);
  }

  addToCart(item: MenuItemModel) {
    const stock = item.remainingQuantity;
    const inCart = this.cartQty(item.productId);
    if (inCart >= stock) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Stock agotado',
        detail: `Solo quedan ${stock} unidad${stock !== 1 ? 'es' : ''} de "${item.productName}".`,
        life: 3000,
      });
      return;
    }
    if (inCart > 0) {
      this.cart.update(items =>
        items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i),
      );
    } else {
      this.cart.update(items => [...items, {
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: 1,
      }]);
    }
  }

  increaseQty(cartItem: CartItem) {
    // Find the menu item across all loaded menus to get global remaining stock
    const menuItem = this.findMenuItem(cartItem.productId);
    if (menuItem && cartItem.quantity >= menuItem.remainingQuantity) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Stock agotado',
        detail: `Solo quedan ${menuItem.remainingQuantity} unidad${menuItem.remainingQuantity !== 1 ? 'es' : ''} de "${cartItem.productName}".`,
        life: 3000,
      });
      return;
    }
    this.cart.update(items =>
      items.map(i => i.productId === cartItem.productId ? { ...i, quantity: i.quantity + 1 } : i),
    );
  }

  decreaseQty(cartItem: CartItem) {
    if (cartItem.quantity <= 1) {
      this.removeFromCart(cartItem);
    } else {
      this.cart.update(items =>
        items.map(i => i.productId === cartItem.productId ? { ...i, quantity: i.quantity - 1 } : i),
      );
    }
  }

  removeFromCart(cartItem: CartItem) {
    this.cart.update(items => items.filter(i => i.productId !== cartItem.productId));
  }

  private findMenuItem(productId: number): MenuItemModel | undefined {
    const menus = this.menus();
    for (const type of ['food', 'daily', 'drinks'] as MenuType[]) {
      const found = menus[type]?.items.find(i => i.productId === productId);
      if (found) return found;
    }
    return undefined;
  }

  async saveOrder() {
    if (this.cart().length === 0 || this.saving()) return;
    this.saving.set(true);
    try {
      await this.createOrder.execute({
        tableNumber: this.tableNumber(),
        items: this.cart().map(i => ({
          productId: i.productId,
          productName: i.productName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Comanda guardada',
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

  increaseTable() { this.tableNumber.update(n => n + 1); }
  decreaseTable() { if (this.tableNumber() > 1) this.tableNumber.update(n => n - 1); }
  goBack() { this.router.navigate(['/orders']); }
}
