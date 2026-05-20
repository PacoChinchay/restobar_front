import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MenuModel, MenuItemModel } from '../../../core/domain/models/menu.model';
import { ManageMenusUseCase } from '../../../core/application/use-cases/manage-menus.use-case';
import { GetProductsUseCase } from '../../../core/application/use-cases/get-products.use-case';
import { GetCategoriesUseCase } from '../../../core/application/use-cases/get-categories.use-case';
import { Product } from '../../../core/domain/models/product.model';

interface EditorItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [Button, InputText, FormsModule, DecimalPipe],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.scss',
})
export class MenusComponent implements OnInit {
  private useCase = inject(ManageMenusUseCase);
  private getProducts = inject(GetProductsUseCase);
  private getCategories = inject(GetCategoriesUseCase);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ── List state ────────────────────────────────────────────────────────────
  readonly menus = signal<MenuModel[]>([]);
  readonly loading = signal(false);

  // ── Editor state ──────────────────────────────────────────────────────────
  readonly editorOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);

  editorName = '';
  readonly editorItems = signal<EditorItem[]>([]);

  // Catalog for editor
  readonly products = signal<Product[]>([]);
  readonly categories = signal<string[]>([]);
  readonly selectedCategory = signal('');

  readonly filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    return cat ? this.products().filter(p => p.category === cat) : this.products();
  });

  readonly editorTitle = computed(() =>
    this.editingId() ? 'Editar menú' : 'Nuevo menú'
  );

  // ── Inline quantity editing for active menu ───────────────────────────────
  readonly editingQtyItemId = signal<number | null>(null);
  editingQtyValue = 0;

  async ngOnInit() {
    await this.loadMenus();
  }

  async loadMenus() {
    this.loading.set(true);
    try { this.menus.set(await this.useCase.getAll()); }
    finally { this.loading.set(false); }
  }

  // ── Editor open/close ─────────────────────────────────────────────────────
  async openCreate() {
    await this.loadCatalog();
    this.editingId.set(null);
    this.editorName = '';
    this.editorItems.set([]);
    this.editorOpen.set(true);
  }

  async openEdit(menu: MenuModel) {
    await this.loadCatalog();
    this.editingId.set(menu.id);
    this.editorName = menu.name;
    this.editorItems.set(menu.items.map(i => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: i.unitPrice,
      quantity: i.remainingQuantity,
    })));
    this.editorOpen.set(true);
  }

  closeEditor() {
    this.editorOpen.set(false);
  }

  private async loadCatalog() {
    if (this.products().length) return;
    const [prods, cats] = await Promise.all([
      this.getProducts.execute(),
      this.getCategories.execute(),
    ]);
    this.products.set(prods.filter(p => p.active));
    const catNames = cats.map(c => c.name);
    this.categories.set(catNames);
    if (catNames.length) this.selectedCategory.set(catNames[0]);
  }

  selectCategory(cat: string) { this.selectedCategory.set(cat); }

  addProduct(product: Product) {
    const existing = this.editorItems().find(i => i.productId === product.id);
    if (existing) {
      this.editorItems.update(items =>
        items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      this.editorItems.update(items => [...items, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
      }]);
    }
  }

  increaseQty(item: EditorItem) {
    this.editorItems.update(items =>
      items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i)
    );
  }

  decreaseQty(item: EditorItem) {
    if (item.quantity <= 1) {
      this.removeItem(item);
    } else {
      this.editorItems.update(items =>
        items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity - 1 } : i)
      );
    }
  }

  removeItem(item: EditorItem) {
    this.editorItems.update(items => items.filter(i => i.productId !== item.productId));
  }

  itemQty(productId: number): number {
    return this.editorItems().find(i => i.productId === productId)?.quantity ?? 0;
  }

  async save() {
    if (!this.editorName.trim() || this.editorItems().length === 0 || this.saving()) return;
    this.saving.set(true);
    try {
      const request = {
        name: this.editorName.trim(),
        items: this.editorItems().map(i => ({
          productId: i.productId,
          productName: i.productName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      };
      const id = this.editingId();
      if (id) {
        await this.useCase.update(id, request);
        this.messageService.add({ severity: 'success', summary: 'Menú actualizado', life: 3000 });
      } else {
        await this.useCase.create(request);
        this.messageService.add({ severity: 'success', summary: 'Menú creado', life: 3000 });
      }
      this.editorOpen.set(false);
      await this.loadMenus();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el menú.', life: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  // ── Activate / Deactivate ─────────────────────────────────────────────────
  async toggleActive(menu: MenuModel) {
    try {
      if (menu.isActive) {
        await this.useCase.deactivate(menu.id);
      } else {
        await this.useCase.activate(menu.id);
      }
      await this.loadMenus();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.', life: 4000 });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(menu: MenuModel) {
    this.confirmationService.confirm({
      message: `¿Eliminar el menú "${menu.name}"? Esta acción no se puede deshacer.`,
      header: 'Eliminar menú',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.useCase.delete(menu.id);
          await this.loadMenus();
          this.messageService.add({ severity: 'success', summary: 'Menú eliminado', life: 3000 });
        } catch {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.', life: 4000 });
        }
      },
    });
  }

  // ── Inline remaining quantity edit (admin adjustment) ─────────────────────
  startEditQty(item: MenuItemModel) {
    this.editingQtyItemId.set(item.id);
    this.editingQtyValue = item.remainingQuantity;
  }

  async saveQty(menu: MenuModel, item: MenuItemModel) {
    try {
      const updated = await this.useCase.updateItemQuantity(menu.id, item.id, this.editingQtyValue);
      this.menus.update(list => list.map(m => m.id === menu.id ? updated : m));
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la cantidad.', life: 4000 });
    } finally {
      this.editingQtyItemId.set(null);
    }
  }

  cancelEditQty() { this.editingQtyItemId.set(null); }
}
